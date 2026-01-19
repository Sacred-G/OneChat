import { getMongoDb } from "@/lib/mongodb";
import { randomUUID } from "crypto";

type AdapterUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
};

type AdapterAccount = {
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
};

type AdapterSession = {
  sessionToken: string;
  userId: string;
  expires: Date;
};

type VerificationToken = {
  identifier: string;
  token: string;
  expires: Date;
};

const USERS = "auth_users";
const ACCOUNTS = "auth_accounts";
const SESSIONS = "auth_sessions";
const VERIFICATION_TOKENS = "auth_verification_tokens";

function normalizeUser(doc: any): AdapterUser {
  if (!doc) return { id: "" };
  return {
    id: String(doc._id ?? doc.id ?? ""),
    name: typeof doc.name === "string" ? doc.name : doc.name ?? null,
    email: typeof doc.email === "string" ? doc.email : doc.email ?? null,
    emailVerified: doc.emailVerified instanceof Date ? doc.emailVerified : doc.emailVerified ? new Date(doc.emailVerified) : null,
    image: typeof doc.image === "string" ? doc.image : doc.image ?? null,
  };
}

export function MongoDbAdapter() {
  return {
    async createUser(user: Omit<AdapterUser, "id">) {
      const db = await getMongoDb();
      const id = randomUUID();
      const doc = {
        _id: id,
        name: user.name ?? null,
        email: user.email ?? null,
        emailVerified: user.emailVerified ?? null,
        image: user.image ?? null,
      };
      await db.collection(USERS).insertOne(doc);
      return normalizeUser(doc);
    },

    async getUser(id: string) {
      const db = await getMongoDb();
      const doc = await db.collection(USERS).findOne({ _id: id });
      return doc ? normalizeUser(doc) : null;
    },

    async getUserByEmail(email: string) {
      const db = await getMongoDb();
      const doc = await db.collection(USERS).findOne({ email });
      return doc ? normalizeUser(doc) : null;
    },

    async getUserByAccount(account: { provider: string; providerAccountId: string }) {
      const db = await getMongoDb();
      const acc = await db.collection(ACCOUNTS).findOne({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      });
      if (!acc?.userId) return null;
      const user = await db.collection(USERS).findOne({ _id: String(acc.userId) });
      return user ? normalizeUser(user) : null;
    },

    async updateUser(user: Partial<AdapterUser> & { id: string }) {
      const db = await getMongoDb();
      const update: any = {};
      if ("name" in user) update.name = user.name ?? null;
      if ("email" in user) update.email = user.email ?? null;
      if ("emailVerified" in user) update.emailVerified = user.emailVerified ?? null;
      if ("image" in user) update.image = user.image ?? null;
      await db.collection(USERS).updateOne({ _id: user.id }, { $set: update });
      const next = await db.collection(USERS).findOne({ _id: user.id });
      return normalizeUser(next);
    },

    async deleteUser(userId: string) {
      const db = await getMongoDb();
      await db.collection(USERS).deleteOne({ _id: userId });
      await db.collection(ACCOUNTS).deleteMany({ userId });
      await db.collection(SESSIONS).deleteMany({ userId });
    },

    async linkAccount(account: AdapterAccount) {
      const db = await getMongoDb();
      await db.collection(ACCOUNTS).updateOne(
        {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
        { $set: { ...account } },
        { upsert: true }
      );
      return account;
    },

    async unlinkAccount(params: { provider: string; providerAccountId: string }) {
      const db = await getMongoDb();
      await db.collection(ACCOUNTS).deleteOne({
        provider: params.provider,
        providerAccountId: params.providerAccountId,
      });
    },

    async createSession(session: AdapterSession) {
      const db = await getMongoDb();
      const doc = {
        _id: session.sessionToken,
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
      await db.collection(SESSIONS).insertOne(doc);
      return session;
    },

    async getSessionAndUser(sessionToken: string) {
      const db = await getMongoDb();
      const s = await db.collection(SESSIONS).findOne({ sessionToken });
      if (!s?.userId) return null;
      const u = await db.collection(USERS).findOne({ _id: String(s.userId) });
      if (!u) return null;
      return {
        session: {
          sessionToken: String(s.sessionToken),
          userId: String(s.userId),
          expires: s.expires instanceof Date ? s.expires : new Date(s.expires),
        },
        user: normalizeUser(u),
      };
    },

    async updateSession(session: Partial<AdapterSession> & { sessionToken: string }) {
      const db = await getMongoDb();
      const update: any = {};
      if ("userId" in session) update.userId = session.userId;
      if ("expires" in session) update.expires = session.expires;
      await db.collection(SESSIONS).updateOne({ sessionToken: session.sessionToken }, { $set: update });
      const next = await db.collection(SESSIONS).findOne({ sessionToken: session.sessionToken });
      if (!next) return null;
      return {
        sessionToken: String(next.sessionToken),
        userId: String(next.userId),
        expires: next.expires instanceof Date ? next.expires : new Date(next.expires),
      };
    },

    async deleteSession(sessionToken: string) {
      const db = await getMongoDb();
      await db.collection(SESSIONS).deleteOne({ sessionToken });
    },

    async createVerificationToken(token: VerificationToken) {
      const db = await getMongoDb();
      await db.collection(VERIFICATION_TOKENS).insertOne({
        _id: token.token,
        identifier: token.identifier,
        token: token.token,
        expires: token.expires,
      });
      return token;
    },

    async useVerificationToken(params: { identifier: string; token: string }) {
      const db = await getMongoDb();
      const doc = await db.collection(VERIFICATION_TOKENS).findOneAndDelete({
        identifier: params.identifier,
        token: params.token,
      });
      const v: any = doc?.value;
      if (!v) return null;
      return {
        identifier: String(v.identifier),
        token: String(v.token),
        expires: v.expires instanceof Date ? v.expires : new Date(v.expires),
      };
    },
  };
}
