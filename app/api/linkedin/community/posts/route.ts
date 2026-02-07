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

export async function GET(request: Request) {
  try {
    const token = await getAccessToken();
    const url = new URL(request.url);

    const organizationId = url.searchParams.get("organizationId") || "";
    const count = url.searchParams.get("count") || "10";
    const sortBy = url.searchParams.get("sortBy") || "LAST_MODIFIED";

    if (!organizationId) {
      return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
    }

    const linkedinVersion =
      (process.env.LINKEDIN_VERSION as string | undefined) || DEFAULT_LINKEDIN_VERSION;

    const authorUrn = `urn:li:organization:${organizationId}`;

    const apiUrl = new URL("https://api.linkedin.com/rest/posts");
    apiUrl.searchParams.set("author", authorUrn);
    apiUrl.searchParams.set("q", "author");
    apiUrl.searchParams.set("count", count);
    apiUrl.searchParams.set("sortBy", sortBy);

    const res = await fetch(apiUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Linkedin-Version": linkedinVersion,
        "X-Restli-Protocol-Version": "2.0.0",
        "X-RestLi-Method": "FINDER",
      },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.message || data?.error || JSON.stringify(data) || `Failed (${res.status})`;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 401 }
    );
  }
}
