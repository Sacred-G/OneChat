import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getOrCreateSessionId } from "@/lib/session";
import { getMicrosoftConfig, MICROSOFT_SCOPES } from "@/lib/microsoft-auth";

const STATE_COOKIE = "ms_oauth_state";

export async function GET() {
  const config = getMicrosoftConfig();
  const jar = await cookies();

  await getOrCreateSessionId();

  const state = randomBytes(16).toString("hex");

  jar.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
  });

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    response_mode: "query",
    scope: MICROSOFT_SCOPES.join(" "),
    state,
    prompt: "consent",
  });

  const authUrl = `${config.authorizeEndpoint}?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
