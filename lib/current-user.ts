import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateSessionId } from "@/lib/session";

export async function getCurrentActorId(): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).id) {
      return `user:${String((session.user as any).id)}`;
    }
    if (session?.user?.email) {
      return `user:${session.user.email}`;
    }
  } catch {
    // ignore auth failures and fall back to anonymous browser identity
  }

  const sessionId = await getOrCreateSessionId();
  return `anon:${sessionId}`;
}
