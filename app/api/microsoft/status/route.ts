import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionId } from "@/lib/session";
import { getMsTokenSet, isMicrosoftConfigured } from "@/lib/microsoft-auth";

export async function GET() {
  const sessionId = await getSessionId();
  const tokenSet = getMsTokenSet(sessionId);
  const jar = await cookies();
  const accessToken = jar.get("ms_access_token")?.value;

  return NextResponse.json({
    connected: Boolean(tokenSet?.access_token || accessToken),
    oauthConfigured: isMicrosoftConfigured(),
  });
}
