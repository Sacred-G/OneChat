import { getMongoDb } from "@/lib/mongodb";

export type LinkedInTokenDoc = {
  _id: string;
  access_token: string;
  expires_at?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

const COLLECTION = "linkedin_tokens";

export async function saveLinkedInToken(sessionId: string, doc: Omit<LinkedInTokenDoc, "_id">) {
  const db = await getMongoDb();
  await db.collection<LinkedInTokenDoc>(COLLECTION).updateOne(
    { _id: sessionId },
    {
      $set: {
        ...doc,
        _id: sessionId,
      },
    },
    { upsert: true }
  );
}

export async function getLinkedInToken(sessionId: string): Promise<LinkedInTokenDoc | null> {
  const db = await getMongoDb();
  const doc = await db.collection<LinkedInTokenDoc>(COLLECTION).findOne({ _id: sessionId });
  return doc || null;
}

export async function clearLinkedInToken(sessionId: string) {
  const db = await getMongoDb();
  await db.collection<LinkedInTokenDoc>(COLLECTION).deleteOne({ _id: sessionId });
}
