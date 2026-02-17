import os
import json
import time
import textwrap
from typing import Optional, Dict, Any, Tuple

import streamlit as st

# Optional deps: we avoid hard-failing if not installed; user can add them later.
try:
    import msal  # type: ignore
except Exception:  # pragma: no cover
    msal = None

try:
    import requests  # type: ignore
except Exception:  # pragma: no cover
    requests = None


APP_TITLE = "M365 User Provisioner"

st.set_page_config(page_title=APP_TITLE, page_icon="🧭", layout="wide")


# ---------------------------
# Helpers
# ---------------------------

def _require_libs() -> Tuple[bool, str]:
    missing = []
    if msal is None:
        missing.append("msal")
    if requests is None:
        missing.append("requests")
    if missing:
        return False, f"Missing Python packages: {', '.join(missing)}. Install them in your environment (e.g., pip install {' '.join(missing)})."
    return True, ""


def mask(s: str, keep: int = 4) -> str:
    if not s:
        return ""
    if len(s) <= keep:
        return "•" * len(s)
    return "•" * (len(s) - keep) + s[-keep:]


def graph_token_client_credentials(tenant_id: str, client_id: str, client_secret: str, authority_host: str) -> Dict[str, Any]:
    ok, msg = _require_libs()
    if not ok:
        raise RuntimeError(msg)

    authority = f"{authority_host.rstrip('/')}/{tenant_id}"
    app = msal.ConfidentialClientApplication(
        client_id=client_id,
        client_credential=client_secret,
        authority=authority,
    )
    result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    return result


def graph_headers(access_token: str) -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }


def graph_post(url: str, access_token: str, payload: Dict[str, Any]) -> requests.Response:  # type: ignore
    return requests.post(url, headers=graph_headers(access_token), json=payload, timeout=60)


def graph_patch(url: str, access_token: str, payload: Dict[str, Any]) -> requests.Response:  # type: ignore
    return requests.patch(url, headers=graph_headers(access_token), json=payload, timeout=60)


def graph_get(url: str, access_token: str) -> requests.Response:  # type: ignore
    return requests.get(url, headers=graph_headers(access_token), timeout=60)


def graph_post_form(url: str, access_token: str, payload: Dict[str, Any]) -> requests.Response:  # type: ignore
    # Same as graph_post; kept for clarity for action endpoints
    return requests.post(url, headers=graph_headers(access_token), json=payload, timeout=60)


def pretty_json(obj: Any) -> str:
    return json.dumps(obj, indent=2, sort_keys=True)


def validate_email(s: str) -> bool:
    s = (s or "").strip()
    return "@" in s and "." in s.split("@", 1)[-1]


def make_temp_password() -> str:
    # Simple temporary password generator (policy compliant in most tenants, but adjust if needed)
    # Avoid ambiguous characters.
    import secrets
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*?-_"
    return "Tmp-" + "".join(secrets.choice(alphabet) for _ in range(14))


def create_user(access_token: str, display_name: str, user_principal_name: str, mail_nickname: str, temp_password: str, force_change: bool = True) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    url = "https://graph.microsoft.com/v1.0/users"
    payload = {
        "accountEnabled": True,
        "displayName": display_name,
        "mailNickname": mail_nickname,
        "userPrincipalName": user_principal_name,
        "passwordProfile": {
            "forceChangePasswordNextSignIn": force_change,
            "password": temp_password,
        },
    }
    r = graph_post(url, access_token, payload)
    if r.status_code in (200, 201):
        return True, "User created.", r.json()
    return False, f"Create user failed ({r.status_code}).", _safe_json(r)


def assign_license(access_token: str, user_id_or_upn: str, sku_id: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    # POST /users/{id | userPrincipalName}/assignLicense
    url = f"https://graph.microsoft.com/v1.0/users/{user_id_or_upn}/assignLicense"
    payload = {
        "addLicenses": [{"skuId": sku_id}],
        "removeLicenses": [],
    }
    r = graph_post_form(url, access_token, payload)
    if r.status_code in (200, 201):
        return True, "License assigned.", r.json()
    return False, f"Assign license failed ({r.status_code}).", _safe_json(r)


def send_mail(access_token: str, from_upn: str, to_email: str, subject: str, html_body: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    # POST /users/{id | userPrincipalName}/sendMail
    url = f"https://graph.microsoft.com/v1.0/users/{from_upn}/sendMail"
    payload = {
        "message": {
            "subject": subject,
            "body": {"contentType": "HTML", "content": html_body},
            "toRecipients": [{"emailAddress": {"address": to_email}}],
        },
        "saveToSentItems": True,
    }
    r = graph_post_form(url, access_token, payload)
    # sendMail returns 202 Accepted on success
    if r.status_code in (202, 200, 201):
        return True, "Email queued/sent.", None
    return False, f"Send mail failed ({r.status_code}).", _safe_json(r)


def list_subscribed_skus(access_token: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    url = "https://graph.microsoft.com/v1.0/subscribedSkus"
    r = graph_get(url, access_token)
    if r.status_code == 200:
        return True, "Loaded subscribed SKUs.", r.json()
    return False, f"Load SKUs failed ({r.status_code}).", _safe_json(r)


def _safe_json(r: requests.Response) -> Optional[Dict[str, Any]]:  # type: ignore
    try:
        return r.json()
    except Exception:
        return {"text": getattr(r, "text", "")}


# ---------------------------
# UI
# ---------------------------

# App chrome / brand
st.markdown(
    """
    <style>
      .block-container { padding-top: 1.2rem; }
      .kicker { letter-spacing: .15em; text-transform: uppercase; font-size: .75rem; opacity: .75; }
      .card { border: 1px solid rgba(255,255,255,.10); border-radius: 18px; padding: 18px 18px; background: rgba(255,255,255,.03); }
      .muted { opacity: .8; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
      .small { font-size: .9rem; }
      .danger { color: #ff6b6b; }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title(APP_TITLE)

colA, colB = st.columns([1.05, 1.4], gap="large")

with colA:
    st.markdown("<div class='kicker'>1) Graph API credentials</div>", unsafe_allow_html=True)
    st.markdown("<div class='card'>", unsafe_allow_html=True)

    st.caption(
        "Enter your Azure AD app details. "
        "This app uses **Client Credentials flow** (app-only). "
        "Your app must have appropriate Microsoft Graph **Application** permissions (admin consent), e.g.:\n"
        "- User.ReadWrite.All (create users)\n"
        "- Organization.Read.All (read subscribed SKUs)\n"
        "- Mail.Send (send email from the chosen mailbox)\n"
        "You can tighten permissions later."
    )

    authority_host = st.selectbox(
        "Authority host",
        options=[
            "https://login.microsoftonline.com",
            "https://login.microsoftonline.us",
            "https://login.microsoftonline.de",
            "https://login.partner.microsoftonline.cn",
        ],
        index=0,
        help="Select based on your cloud (commercial US Gov, etc.).",
    )

    tenant_id = st.text_input("Tenant ID (GUID)", value=os.getenv("M365_TENANT_ID", ""))
    client_id = st.text_input("Client ID (Application ID)", value=os.getenv("M365_CLIENT_ID", ""))
    client_secret = st.text_input(
        "Client Secret",
        value=os.getenv("M365_CLIENT_SECRET", ""),
        type="password",
        help="Stored only in memory for this session unless you put it in Streamlit secrets/env vars.",
    )

    st.divider()

    sender_upn = st.text_input(
        "From mailbox (UPN) used to send the notification email",
        value=os.getenv("M365_SENDER_UPN", ""),
        help="Example: it@yourcompany.com. This mailbox must exist and Mail.Send must allow app-only send.",
    )

    test_btn = st.button("Test connection", use_container_width=True)

    token_result = None
    access_token = None

    if test_btn:
        try:
            if not (tenant_id and client_id and client_secret):
                st.error("Please fill Tenant ID, Client ID, and Client Secret.")
            else:
                with st.spinner("Requesting token..."):
                    token_result = graph_token_client_credentials(tenant_id, client_id, client_secret, authority_host)
                if "access_token" in token_result:
                    access_token = token_result["access_token"]
                    st.success("Token acquired.")
                    with st.expander("Token details (safe)"):
                        safe = {k: v for k, v in token_result.items() if k not in ("access_token", "refresh_token")}
                        st.code(pretty_json(safe), language="json")
                else:
                    st.error("Failed to acquire token.")
                    st.code(pretty_json(token_result), language="json")
        except Exception as e:
            st.exception(e)

    st.markdown("</div>", unsafe_allow_html=True)

with colB:
    st.markdown("<div class='kicker'>2) Provision user</div>", unsafe_allow_html=True)
    st.markdown("<div class='card'>", unsafe_allow_html=True)

    st.caption(
        "Create a new M365 user, optionally assign an **F1** license (or another SKU you pick), "
        "then send an email to their personal address with next steps."
    )

    # Re-acquire token on demand for actions (don’t rely on Test button)
    def get_access_token_or_error() -> Optional[str]:
        if not (tenant_id and client_id and client_secret):
            st.error("Missing Graph credentials (Tenant ID / Client ID / Client Secret).")
            return None
        try:
            token = graph_token_client_credentials(tenant_id, client_id, client_secret, authority_host)
            if "access_token" not in token:
                st.error("Token request failed.")
                st.code(pretty_json(token), language="json")
                return None
            return token["access_token"]
        except Exception as e:
            st.exception(e)
            return None

    # Load SKUs
    sku_col1, sku_col2 = st.columns([1, 1])
    with sku_col1:
        load_skus = st.button("Load available licenses (SKUs)", use_container_width=True)
    with sku_col2:
        auto_assign = st.toggle("Assign license after creating user", value=True)

    sku_state_key = "subscribed_skus"

    if load_skus:
        at = get_access_token_or_error()
        if at:
            with st.spinner("Loading subscribed SKUs..."):
                ok, msg, data = list_subscribed_skus(at)
            if ok and data:
                st.session_state[sku_state_key] = data
                st.success(msg)
            else:
                st.error(msg)
                if data:
                    st.code(pretty_json(data), language="json")

    sku_choices = []
    sku_map = {}
    if sku_state_key in st.session_state:
        for sku in st.session_state[sku_state_key].get("value", []):
            # skuPartNumber is helpful for finding F1: often "DESKLESSPACK" (M365 F1) or other part numbers
            part = sku.get("skuPartNumber", "")
            sku_id = sku.get("skuId", "")
            prepaid = (sku.get("prepaidUnits") or {})
            enabled = prepaid.get("enabled", None)
            consumed = sku.get("consumedUnits", None)
            label = f"{part}  —  enabled:{enabled} / consumed:{consumed}"
            sku_choices.append(label)
            sku_map[label] = sku_id

    # Default to something that looks like F1 if present
    default_sku_label = None
    for lab in sku_choices:
        if "DESKLESS" in lab.upper() or "F1" in lab.upper():
            default_sku_label = lab
            break

    selected_sku_label = st.selectbox(
        "License SKU to assign",
        options=(sku_choices if sku_choices else ["(Load SKUs to select)"]),
        index=(sku_choices.index(default_sku_label) if (sku_choices and default_sku_label in sku_choices) else 0),
        disabled=not bool(sku_choices),
        help="For M365 F1, look for skuPartNumber often like DESKLESSPACK. Always verify in your tenant.",
    )

    st.divider()

    form = st.form("create_user_form", clear_on_submit=False)
    with form:
        left, right = st.columns([1, 1], gap="large")
        with left:
            company_email = st.text_input("Company email / UPN to create", placeholder="jane.doe@yourcompany.com")
            display_name = st.text_input("Display name", placeholder="Jane Doe")
            mail_nickname = st.text_input(
                "Mail nickname",
                placeholder="jane.doe",
                help="Often the part before @. Used by Exchange. If blank, we auto-derive from UPN.",
            )

        with right:
            personal_email = st.text_input("Personal email (notification destination)", placeholder="jane.doe@gmail.com")
            force_change = st.checkbox("Force password change at first sign-in", value=True)
            generate_password = st.checkbox("Generate temporary password", value=True)
            temp_password = st.text_input(
                "Temporary password",
                type="password",
                value="" if generate_password else "",
                placeholder="Will be generated" if generate_password else "Enter temp password",
            )

        st.divider()

        st.markdown("<div class='kicker'>Notification email template</div>", unsafe_allow_html=True)
        subject = st.text_input("Email subject", value="Your company account is ready")

        default_body = """
        <p>Hi {display_name},</p>
        <p>Your company email has been created:</p>
        <ul>
          <li><b>Company email:</b> {company_email}</li>
        </ul>
        <p><b>Next steps</b></p>
        <ol>
          <li>Go to <a href="https://portal.office.com">https://portal.office.com</a></li>
          <li>Sign in with your company email</li>
          <li>Use your temporary password (provided separately) and set a new password</li>
          <li>Set up Microsoft Authenticator if prompted</li>
        </ol>
        <p>If you have any issues, reply to this email or contact IT.</p>
        <p>— IT Team</p>
        """.strip()

        body = st.text_area(
            "Email body (HTML)",
            value=default_body,
            height=220,
            help="You can include {display_name} and {company_email} placeholders.",
        )

        include_password_in_email = st.checkbox(
            "Include temporary password in the email (not recommended)",
            value=False,
            help="Prefer sending password via a separate secure channel.",
        )

        submit = st.form_submit_button("Create user and notify", use_container_width=True)

    if submit:
        # Validation
        errors = []
        if not validate_email(company_email):
            errors.append("Company email/UPN is not a valid email.")
        if not display_name.strip():
            errors.append("Display name is required.")
        if not validate_email(personal_email):
            errors.append("Personal email is not a valid email.")
        if not sender_upn.strip():
            errors.append("From mailbox (sender UPN) is required to send the notification.")

        if errors:
            for e in errors:
                st.error(e)
        else:
            at = get_access_token_or_error()
            if at:
                if generate_password:
                    real_temp_password = make_temp_password()
                else:
                    if not temp_password.strip():
                        st.error("Temporary password is required when not generating one.")
                        st.stop()
                    real_temp_password = temp_password.strip()

                if not mail_nickname.strip():
                    mail_nick = company_email.split("@", 1)[0]
                else:
                    mail_nick = mail_nickname.strip()

                st.markdown("---")
                with st.spinner("Creating user..."):
                    ok, msg, data = create_user(
                        at,
                        display_name=display_name.strip(),
                        user_principal_name=company_email.strip(),
                        mail_nickname=mail_nick,
                        temp_password=real_temp_password,
                        force_change=force_change,
                    )

                if not ok:
                    st.error(msg)
                    if data:
                        st.code(pretty_json(data), language="json")
                    st.stop()

                # License assignment
                if auto_assign:
                    if not sku_choices:
                        st.warning("SKUs were not loaded, so license assignment was skipped. Click 'Load available licenses' and try again.")
                    else:
                        sku_id = sku_map.get(selected_sku_label)
                        if not sku_id:
                            st.warning("Could not resolve selected SKU ID; skipping license assignment.")
                        else:
                            with st.spinner("Assigning license..."):
                                ok2, msg2, data2 = assign_license(at, company_email.strip(), sku_id)
                            if ok2:
                                st.success(msg2)
                            else:
                                st.error(msg2)
                                if data2:
                                    st.code(pretty_json(data2), language="json")

                # Send email
                fmt_body = body.replace("{display_name}", display_name.strip()).replace("{company_email}", company_email.strip())
                if include_password_in_email:
                    fmt_body += f"<hr><p><b>Temporary password:</b> <span style='font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;'>{real_temp_password}</span></p>"

                with st.spinner("Sending notification email..."):
                    ok3, msg3, data3 = send_mail(
                        at,
                        from_upn=sender_upn.strip(),
                        to_email=personal_email.strip(),
                        subject=subject.strip(),
                        html_body=fmt_body,
                    )

                if ok3:
                    st.success("Done: user created and notification sent.")
                    st.info(
                        "If you did **not** include the password in the email, share the temporary password via a secure channel."
                    )
                    with st.expander("Temporary password (show)"):
                        st.code(real_temp_password)
                else:
                    st.error(msg3)
                    if data3:
                        st.code(pretty_json(data3), language="json")

    st.markdown("</div>", unsafe_allow_html=True)


st.markdown("---")
with st.expander("Offboarding (planned)"):
    st.write(
        "You asked to add offboarding later. Typical offboarding steps we can implement next include:\n"
        "- Block sign-in / disable account\n"
        "- Reset password\n"
        "- Remove licenses\n"
        "- Convert mailbox to shared / set forwarding\n"
        "- Remove from groups / revoke sessions\n\n"
        "When you’re ready, tell me which steps you want and whether you want a dry-run mode."
    )


with st.expander("Security notes"):
    st.markdown(
        """
        - This app currently uses **app-only** Graph permissions (Client Credentials flow).\n
        - For production, prefer storing secrets in **Streamlit Secrets** or environment variables rather than typing them each time.\n
        - Sending passwords over email is risky; use a separate secure channel.\n
        - License selection uses your tenant's **subscribedSkus**; confirm the correct SKU for **F1** in your tenant.
        """
    )
