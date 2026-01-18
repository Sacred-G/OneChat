import { MongoClient } from "mongodb";

const uri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/responses_starter_app";

const dbNameFromUri = (() => {
  try {
    const url = new URL(uri);
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
  const client = new MongoClient(uri);
  globalForMongo._mongoClientPromise = client.connect();
}

const clientPromise = globalForMongo._mongoClientPromise;

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

export async function getMongoDb() {
  const client = await getMongoClient();
  return client.db(dbName);
}
