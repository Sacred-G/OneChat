import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionId } from "@/lib/session";
import { getLinkedInToken } from "@/lib/linkedin-store";

const DEFAULT_LINKEDIN_VERSION = "202601";

async function getAccessToken(): Promise<string> {
  const jar = await cookies();
  const cookieToken = jar.get("li_access_token")?.value;
  if (cookieToken) return cookieToken;

  const sessionId = await getSessionId();
  if (!sessionId) throw new Error("No session");
  const doc = await getLinkedInToken(sessionId);
  if (!doc?.access_token) throw new Error("Not connected");
  return doc.access_token;
}

export async function POST(request: Request) {
  try {
    const token = await getAccessToken();
    const body = (await request.json().catch(() => null)) as any;

    const organizationId = typeof body?.organizationId === "string" ? body.organizationId.trim() : "";
    const commentary = typeof body?.commentary === "string" ? body.commentary : "";

    if (!organizationId) {
      return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
    }
    if (!commentary.trim()) {
      return NextResponse.json({ error: "Missing commentary" }, { status: 400 });
    }

    const linkedinVersion =
      (process.env.LINKEDIN_VERSION as string | undefined) || DEFAULT_LINKEDIN_VERSION;

    const authorUrn = `urn:li:organization:${organizationId}`;

    const res = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Linkedin-Version": linkedinVersion,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: authorUrn,
        commentary,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return NextResponse.json(
        { error: txt || `Create post failed (${res.status})` },
        { status: 400 }
      );
    }

    const id = res.headers.get("x-restli-id") || "";
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 401 }
    );
  }
}
