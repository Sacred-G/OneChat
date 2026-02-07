import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionId } from "@/lib/session";
import { getLinkedInToken } from "@/lib/linkedin-store";

export async function GET() {
  const { LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI } =
    process.env as Record<string, string | undefined>;

  const oauthConfigured = Boolean(
    LINKEDIN_CLIENT_ID && LINKEDIN_CLIENT_SECRET && LINKEDIN_REDIRECT_URI
  );

  const jar = await cookies();
  const cookieToken = jar.get("li_access_token")?.value;

  let connected = Boolean(cookieToken);

  if (!connected) {
    const sessionId = await getSessionId();
    if (sessionId) {
      const dbToken = await getLinkedInToken(sessionId);
      connected = Boolean(dbToken?.access_token);
    }
  }

  return NextResponse.json({ connected, oauthConfigured });
}
