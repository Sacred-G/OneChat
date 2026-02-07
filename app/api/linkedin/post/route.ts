import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionId } from "@/lib/session";
import { getLinkedInToken } from "@/lib/linkedin-store";

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
    const text = typeof body?.text === "string" ? body.text : "";

    if (!organizationId) {
      return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const payload = {
      author: `urn:li:organization:${organizationId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(payload),
    });

    const txt = await res.text().catch(() => "");
    if (!res.ok) {
      return NextResponse.json(
        { error: txt || `LinkedIn post failed (${res.status})` },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, result: txt ? JSON.parse(txt) : null });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 401 }
    );
  }
}
