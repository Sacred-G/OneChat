import "server-only";

const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";

function json(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isAllowedRecipient(to: string, allowlist: string[]) {
  if (allowlist.length === 0) return false;
  return allowlist.includes(to.trim().toLowerCase());
}

export async function POST(request: Request) {
  let to: unknown;
  let subject: unknown;
  let text: unknown;
  let html: unknown;
  let dryRun: unknown;

  try {
    const body = await request.json();
    to = body?.to;
    subject = body?.subject;
    text = body?.text;
    html = body?.html;
    dryRun = body?.dry_run;
  } catch {
    return json(400, { ok: false, error: "Invalid JSON" });
  }

  if (!to || typeof to !== "string") {
    return json(400, { ok: false, error: "Missing to" });
  }
  if (!subject || typeof subject !== "string") {
    return json(400, { ok: false, error: "Missing subject" });
  }
  if (!text || typeof text !== "string") {
    return json(400, { ok: false, error: "Missing text" });
  }
  if (typeof html !== "undefined" && typeof html !== "string") {
    return json(400, { ok: false, error: "Invalid html" });
  }

  const dry_run = typeof dryRun === "boolean" ? dryRun : true;

  if (dry_run) {
    return json(200, {
      ok: true,
      dry_run: true,
      preview: {
        to,
        subject,
        has_html: typeof html === "string" && html.length > 0,
        text,
      },
    });
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const fromName = process.env.SENDGRID_FROM_NAME;

  if (!fromEmail) {
    return json(500, { ok: false, error: "SENDGRID_FROM_EMAIL not configured" });
  }

  const allowlist = String(process.env.SENDGRID_ALLOWED_RECIPIENTS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!isAllowedRecipient(to, allowlist)) {
    return json(403, {
      ok: false,
      error:
        "Recipient not allowlisted. Add email to SENDGRID_ALLOWED_RECIPIENTS to enable sending.",
      to,
      allowlist,
    });
  }

  const payload: any = {
    personalizations: [
      {
        to: [{ email: to }],
        subject,
      },
    ],
    from: {
      email: fromEmail,
      ...(fromName ? { name: fromName } : {}),
    },
    content: [
      {
        type: "text/plain",
        value: text,
      },
      ...(typeof html === "string"
        ? [
            {
              type: "text/html",
              value: html,
            },
          ]
        : []),
    ],
  };

  if (!apiKey) {
    return json(500, { ok: false, error: "SENDGRID_API_KEY not configured" });
  }

  try {
    const res = await fetch(SENDGRID_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return json(res.status, {
        ok: false,
        error: `SendGrid error: ${res.status}`,
        details: text || null,
      });
    }

    return json(200, { ok: true, dry_run: false });
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    return json(500, { ok: false, error: msg });
  }
}
