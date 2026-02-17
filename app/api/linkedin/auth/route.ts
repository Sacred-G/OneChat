import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getOrCreateSessionId } from "@/lib/session";

const STATE_COOKIE = "li_oauth_state";

export async function GET() {
  const { LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI } =
    process.env as Record<string, string | undefined>;

  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET || !LINKEDIN_REDIRECT_URI) {
    return NextResponse.json(
      { error: "Missing LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, or LINKEDIN_REDIRECT_URI" },
      { status: 400 }
    );
  }

  await getOrCreateSessionId();

  const state = randomBytes(16).toString("hex");
  const jar = await cookies();

  jar.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
  });

  // Company page posting + admin page discovery.
  // Avoid requesting profile scopes (e.g. r_liteprofile) because many apps are not approved for them.
  const scope = ["rw_organization_admin", "r_organization_social", "w_organization_social"].join(
    " "
  );

  const url = new URL("https://www.linkedin.com/oauth/v2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", LINKEDIN_CLIENT_ID);
  url.searchParams.set("redirect_uri", LINKEDIN_REDIRECT_URI);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", scope);

  return NextResponse.redirect(url.toString());
}
