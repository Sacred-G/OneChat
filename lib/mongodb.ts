import { MongoClient } from "mongodb";

const isHosted = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";
const uri = process.env.MONGODB_URI || "";

if (!uri && isHosted) {
  throw new Error("Missing MONGODB_URI environment variable");
}

const effectiveUri = uri || "mongodb://127.0.0.1:27017/responses_starter_app";

const dbNameFromUri = (() => {
  try {
    const url = new URL(effectiveUri);
    const pathname = url.pathname || "";
    const name = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    return name || undefined;
  } catch {
    return undefined;
  }
})();

const dbName = process.env.MONGODB_DB || dbNameFromUri || "responses_starter_app";

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (!globalForMongo._mongoClientPromise) {
  const client = new MongoClient(effectiveUri, {
    serverSelectionTimeoutMS: 5_000,
  });
  globalForMongo._mongoClientPromise = client.connect().catch((err) => {
    globalForMongo._mongoClientPromise = undefined;
    throw err;
  });
}

const clientPromise = globalForMongo._mongoClientPromise;

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

export async function getMongoDb() {
  const client = await getMongoClient();
  return client.db(dbName);
}
