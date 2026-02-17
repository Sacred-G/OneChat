import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionId } from "@/lib/session";
import { getLinkedInToken } from "@/lib/linkedin-store";

const DEFAULT_LINKEDIN_VERSION = "202601";
const MAX_IMAGES = 9;

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

async function initImageUpload(params: {
  token: string;
  ownerUrn: string;
  linkedinVersion: string;
}): Promise<{ uploadUrl: string; imageUrn: string }> {
  const res = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
      "Linkedin-Version": params.linkedinVersion,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: params.ownerUrn,
      },
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.message || data?.error || JSON.stringify(data) || `Init upload failed (${res.status})`;
    throw new Error(msg);
  }

  const uploadUrl = String(data?.value?.uploadUrl || "");
  const imageUrn = String(data?.value?.image || "");
  if (!uploadUrl || !imageUrn) throw new Error("LinkedIn initializeUpload returned missing fields");

  return { uploadUrl, imageUrn };
}

async function uploadToUrl(uploadUrl: string, file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      ...(file.type ? { "Content-Type": file.type } : {}),
    },
    body: buf,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Upload failed (${res.status})`);
  }
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchUrlAsFile(url: string): Promise<File> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Failed to fetch image URL (${res.status})`);
  }

  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : contentType.includes("gif")
        ? "gif"
        : "jpg";
  const name = `image.${ext}`;

  return new File([buf], name, { type: contentType });
}

async function createMultiImagePost(params: {
  token: string;
  authorUrn: string;
  commentary: string;
  imageUrns: string[];
  linkedinVersion: string;
}): Promise<string> {
  const res = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
      "Linkedin-Version": params.linkedinVersion,
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: params.authorUrn,
      commentary: params.commentary,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
      content: {
        multiImage: {
          images: params.imageUrns.map((id) => ({
            id,
            altText: "",
          })),
        },
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Create post failed (${res.status})`);
  }

  const id = res.headers.get("x-restli-id") || "";
  return id;
}

export async function POST(request: Request) {
  try {
    const token = await getAccessToken();
    const form = await request.formData();

    const organizationId = typeof form.get("organizationId") === "string" ? String(form.get("organizationId")) : "";
    const commentary = typeof form.get("commentary") === "string" ? String(form.get("commentary")) : "";

    if (!organizationId) {
      return NextResponse.json({ error: "Missing organizationId" }, { status: 400 });
    }
    if (!commentary.trim()) {
      return NextResponse.json({ error: "Missing commentary" }, { status: 400 });
    }

    const uploadedFiles = form.getAll("images").filter((v) => v instanceof File) as File[];
    const imageUrlsRaw = form.getAll("imageUrls").filter((v) => typeof v === "string") as string[];
    const imageUrls = imageUrlsRaw.map((s) => String(s).trim()).filter(Boolean);

    if (uploadedFiles.length === 0 && imageUrls.length === 0) {
      return NextResponse.json({ error: "Missing images" }, { status: 400 });
    }

    if (uploadedFiles.length + imageUrls.length > MAX_IMAGES) {
      return NextResponse.json({ error: `Too many images (max ${MAX_IMAGES})` }, { status: 400 });
    }

    for (const url of imageUrls) {
      if (!isSafeHttpUrl(url)) {
        return NextResponse.json({ error: "Invalid imageUrls (must be http/https URLs)" }, { status: 400 });
      }
    }

    const linkedinVersion =
      (process.env.LINKEDIN_VERSION as string | undefined) || DEFAULT_LINKEDIN_VERSION;

    const ownerUrn = `urn:li:organization:${organizationId}`;

    const fetchedFiles: File[] = [];
    for (const url of imageUrls) {
      fetchedFiles.push(await fetchUrlAsFile(url));
    }

    const images = [...uploadedFiles, ...fetchedFiles];
    if (images.length === 0) {
      return NextResponse.json({ error: "Missing images" }, { status: 400 });
    }

    const uploadedUrns: string[] = [];
    for (const f of images) {
      const { uploadUrl, imageUrn } = await initImageUpload({
        token,
        ownerUrn,
        linkedinVersion,
      });
      await uploadToUrl(uploadUrl, f);
      uploadedUrns.push(imageUrn);
    }

    const postId = await createMultiImagePost({
      token,
      authorUrn: ownerUrn,
      commentary,
      imageUrns: uploadedUrns,
      linkedinVersion,
    });

    return NextResponse.json({ ok: true, id: postId, images: uploadedUrns });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
