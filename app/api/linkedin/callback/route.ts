import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionId } from "@/lib/session";
import { saveLinkedInToken } from "@/lib/linkedin-store";

const STATE_COOKIE = "li_oauth_state";

export async function GET(request: NextRequest) {
  const { LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI } =
    process.env as Record<string, string | undefined>;

  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET || !LINKEDIN_REDIRECT_URI) {
    return NextResponse.redirect(new URL("/?error=linkedin_env", request.url));
  }

  const jar = await cookies();
  const expectedState = jar.get(STATE_COOKIE)?.value;
  jar.delete(STATE_COOKIE);

  const sessionId = await getSessionId();
  if (!sessionId) {
    return NextResponse.redirect(new URL("/?error=no-session", request.url));
  }

  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error") || "";
  const oauthErrorDesc = url.searchParams.get("error_description") || "";
  const code = url.searchParams.get("code") || "";
  const returnedState = url.searchParams.get("state") || "";

  if (oauthError) {
    const msg = oauthErrorDesc || oauthError;
    // If state is present, validate it to avoid CSRF confusion.
    if (returnedState && expectedState && returnedState !== expectedState) {
      return NextResponse.redirect(new URL("/?error=invalid_state", request.url));
    }
    return NextResponse.redirect(
      new URL(`/?error=linkedin_${encodeURIComponent(oauthError)}&error_description=${encodeURIComponent(msg)}`, request.url)
    );
  }

  if (!expectedState || !code || returnedState !== expectedState) {
    return NextResponse.redirect(new URL("/?error=invalid_state", request.url));
  }

  try {
    const tokenUrl = new URL("https://www.linkedin.com/oauth/v2/accessToken");
    const body = new URLSearchParams();
    body.set("grant_type", "authorization_code");
    body.set("code", code);
    body.set("redirect_uri", LINKEDIN_REDIRECT_URI);
    body.set("client_id", LINKEDIN_CLIENT_ID);
    body.set("client_secret", LINKEDIN_CLIENT_SECRET);

    const res = await fetch(tokenUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL(`/?error=oauth_failed_${res.status}`, request.url));
    }

    const data = (await res.json()) as any;
    const accessToken = typeof data.access_token === "string" ? data.access_token : "";
    const expiresIn = typeof data.expires_in === "number" ? data.expires_in : undefined;
    const tokenType = typeof data.token_type === "string" ? data.token_type : undefined;
    const scope = typeof data.scope === "string" ? data.scope : undefined;

    if (!accessToken) {
      return NextResponse.redirect(new URL("/?error=no_access_token", request.url));
    }

    const now = Date.now();
    const expiresAt = expiresIn != null ? now + expiresIn * 1000 : undefined;

    await saveLinkedInToken(sessionId, {
      access_token: accessToken,
      expires_at: expiresAt,
      token_type: tokenType,
      scope,
    });

    jar.set("li_access_token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
    if (expiresAt) {
      jar.set("li_expires_at", String(expiresAt), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return NextResponse.redirect(new URL("/?linkedin_connected=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/?error=oauth_exception", request.url));
  }
}
