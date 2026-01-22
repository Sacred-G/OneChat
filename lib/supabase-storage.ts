import "server-only";

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || typeof url !== "string") {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return url;
}

function getSupabaseServiceRoleKey(): string {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_API_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!key || typeof key !== "string") {
    throw new Error(
      "Missing Supabase service role key (set SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_API_KEY)"
    );
  }
  return key;
}

export function getSupabaseAdmin() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseBucketName(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || "generated-images";
}

export async function getSupabaseObjectViewUrl(args: {
  bucket?: string;
  path: string;
  expiresInSeconds?: number;
}) {
  const supabase = getSupabaseAdmin();
  const bucket = typeof args.bucket === "string" && args.bucket ? args.bucket : getSupabaseBucketName();
  const path = args.path;
  const expiresInSeconds =
    typeof args.expiresInSeconds === "number" && args.expiresInSeconds > 0
      ? args.expiresInSeconds
      : 60 * 60;

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
  if (publicData?.publicUrl) {
    return { url: publicData.publicUrl, isSigned: false };
  }

  const { data: signedData, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  if (error) {
    throw new Error(error.message || "Supabase signed URL failed");
  }
  return { url: signedData?.signedUrl || null, isSigned: true };
}

function extFromMime(mimeType: string): string {
  const m = mimeType.toLowerCase();
  if (m === "image/png") return "png";
  if (m === "image/jpeg" || m === "image/jpg") return "jpg";
  if (m === "image/webp") return "webp";
  if (m === "image/gif") return "gif";
  return "png";
}

export async function uploadGeneratedImage(args: {
  base64: string;
  mimeType?: string;
  prefix?: string;
}) {
  const supabase = getSupabaseAdmin();
  const bucket = getSupabaseBucketName();

  const prefix = typeof args.prefix === "string" && args.prefix.trim() ? args.prefix.trim() : "generated";
  const id = randomUUID();
  const mimeType = typeof args.mimeType === "string" && args.mimeType.trim() ? args.mimeType.trim() : "image/png";
  const ext = extFromMime(mimeType);
  const objectPath = `${prefix}/${id}.${ext}`;

  const buf = Buffer.from(args.base64, "base64");

  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, buf, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "Supabase upload failed");
  }

  let url: string | null = null;
  try {
    const view = await getSupabaseObjectViewUrl({ bucket, path: objectPath, expiresInSeconds: 60 * 60 });
    url = view.url;
  } catch {
    // ignore: bucket may be private without signing enabled, or policies may block URL retrieval
  }

  return {
    bucket,
    path: objectPath,
    url,
  };
}

export async function listGeneratedImages(args?: { prefix?: string; limit?: number }) {
  const supabase = getSupabaseAdmin();
  const bucket = getSupabaseBucketName();

  const prefix = typeof args?.prefix === "string" ? args.prefix : "";
  const limit = typeof args?.limit === "number" ? args.limit : 100;

  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit,
    offset: 0,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    throw new Error(error.message || "Supabase list failed");
  }

  const items = await Promise.all(
    (data || []).map(async (item) => {
      const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
      let url: string | null = null;
      try {
        const view = await getSupabaseObjectViewUrl({ bucket, path: objectPath, expiresInSeconds: 60 * 60 });
        url = view.url;
      } catch {
        // ignore
      }
      return {
        name: item.name,
        path: objectPath,
        created_at: (item as any).created_at,
        url,
      };
    })
  );

  return { bucket, items };
}
