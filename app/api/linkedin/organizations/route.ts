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

function orgIdFromUrn(urn: string) {
  const m = urn.match(/urn:li:organization:(\d+)/);
  return m ? m[1] : "";
}

export async function GET() {
  try {
    const token = await getAccessToken();

    const aclsUrl = new URL("https://api.linkedin.com/v2/organizationalEntityAcls");
    aclsUrl.searchParams.set("q", "roleAssignee");
    aclsUrl.searchParams.set("role", "ADMINISTRATOR");
    aclsUrl.searchParams.set("state", "APPROVED");

    const aclsRes = await fetch(aclsUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    if (!aclsRes.ok) {
      const txt = await aclsRes.text().catch(() => "");
      return NextResponse.json(
        { error: txt || `LinkedIn ACL request failed (${aclsRes.status})` },
        { status: 400 }
      );
    }

    const acls = (await aclsRes.json()) as any;
    const orgUrns: string[] = Array.isArray(acls?.elements)
      ? acls.elements
          .map((e: any) => String(e?.organizationalTarget || ""))
          .filter(Boolean)
      : [];

    const orgIds = Array.from(new Set(orgUrns.map(orgIdFromUrn).filter(Boolean)));

    const orgs = await Promise.all(
      orgIds.map(async (id) => {
        const orgRes = await fetch(
          `https://api.linkedin.com/v2/organizations/${encodeURIComponent(id)}?projection=(id,localizedName,vanityName)`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Restli-Protocol-Version": "2.0.0",
            },
          }
        );
        if (!orgRes.ok) return null;
        const org = (await orgRes.json()) as any;
        return {
          id: String(org?.id || id),
          name: String(org?.localizedName || org?.name || id),
          vanityName: typeof org?.vanityName === "string" ? org.vanityName : undefined,
        };
      })
    );

    return NextResponse.json({ organizations: orgs.filter(Boolean) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 401 }
    );
  }
}
