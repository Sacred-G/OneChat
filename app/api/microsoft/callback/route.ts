import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionId } from "@/lib/session";
import {
  getMicrosoftConfig,
  MICROSOFT_SCOPES,
  saveMsTokenSet,
} from "@/lib/microsoft-auth";

const STATE_COOKIE = "ms_oauth_state";

export async function GET(request: NextRequest) {
  const config = getMicrosoftConfig();
  const jar = await cookies();

  const stateCookie = jar.get(STATE_COOKIE)?.value;
  const sessionId = await getSessionId();

  jar.delete(STATE_COOKIE);

  if (!sessionId) {
    return NextResponse.redirect(new URL("/email?error=no-session", request.url));
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");

  if (!stateCookie || !code || returnedState !== stateCookie) {
    return NextResponse.redirect(
      new URL("/email?error=invalid_state", request.url)
    );
  }

  try {
    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
      scope: MICROSOFT_SCOPES.join(" "),
    });

    const tokenRes = await fetch(config.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Microsoft token exchange failed:", errText);
      return NextResponse.redirect(
        new URL("/email?error=token_exchange_failed", request.url)
      );
    }

    const data = await tokenRes.json();
    const now = Date.now();

    const tokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      id_token: data.id_token,
      token_type: data.token_type,
      scope: data.scope,
      expires_at:
        data.expires_in != null ? now + data.expires_in * 1000 : undefined,
    };

    saveMsTokenSet(sessionId, tokens);

    const cookieOptions = {
      httpOnly: true as const,
      sameSite: "lax" as const,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    };

    if (tokens.access_token)
      jar.set("ms_access_token", tokens.access_token, cookieOptions);
    if (tokens.refresh_token)
      jar.set("ms_refresh_token", tokens.refresh_token, cookieOptions);
    if (tokens.id_token)
      jar.set("ms_id_token", tokens.id_token, cookieOptions);
    if (tokens.expires_at)
      jar.set("ms_expires_at", String(tokens.expires_at), cookieOptions);

    return NextResponse.redirect(new URL("/email?connected=1", request.url));
  } catch (err) {
    console.error("Microsoft OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/email?error=oauth_failed", request.url)
    );
  }
}
