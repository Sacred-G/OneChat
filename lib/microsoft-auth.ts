import { cookies } from "next/headers";
import { getSessionId, OAuthTokens } from "@/lib/session";

// Microsoft uses a separate token store to avoid collisions with Google tokens

export const MICROSOFT_SCOPES = [
  "openid",
  "email",
  "profile",
  "offline_access",
  "https://graph.microsoft.com/Mail.Read",
  "https://graph.microsoft.com/Mail.ReadWrite",
  "https://graph.microsoft.com/Mail.Send",
  "https://graph.microsoft.com/Calendars.Read",
  "https://graph.microsoft.com/Calendars.ReadWrite",
];

export function getMicrosoftConfig() {
  const {
    MICROSOFT_CLIENT_ID,
    MICROSOFT_CLIENT_SECRET,
    MICROSOFT_TENANT_ID,
    MICROSOFT_REDIRECT_URI,
  } = process.env as Record<string, string | undefined>;

  return {
    clientId: MICROSOFT_CLIENT_ID || "",
    clientSecret: MICROSOFT_CLIENT_SECRET || "",
    tenantId: MICROSOFT_TENANT_ID || "common",
    redirectUri:
      MICROSOFT_REDIRECT_URI || "http://localhost:3000/api/microsoft/callback",
    authorizeEndpoint: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID || "common"}/oauth2/v2.0/authorize`,
    tokenEndpoint: `https://login.microsoftonline.com/${MICROSOFT_TENANT_ID || "common"}/oauth2/v2.0/token`,
  };
}

export function isMicrosoftConfigured(): boolean {
  const { MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET } = process.env as Record<
    string,
    string | undefined
  >;
  return Boolean(MICROSOFT_CLIENT_ID && MICROSOFT_CLIENT_SECRET);
}

// In-memory store for Microsoft tokens, keyed by sessionId
const msTokenStore = new Map<string, OAuthTokens>();

export function saveMsTokenSet(sessionId: string, tokens: OAuthTokens) {
  msTokenStore.set(sessionId, tokens);
}

export function getMsTokenSet(sessionId?: string): OAuthTokens | undefined {
  if (!sessionId) return undefined;
  return msTokenStore.get(sessionId);
}

const EXPIRY_SKEW_MS = 30_000;

export async function getFreshMsAccessToken(): Promise<{
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}> {
  const jar = await cookies();
  const sessionId = await getSessionId();
  const tokenSet = getMsTokenSet(sessionId);

  let accessToken =
    jar.get("ms_access_token")?.value || tokenSet?.access_token;
  let refreshToken =
    jar.get("ms_refresh_token")?.value || tokenSet?.refresh_token;
  const expiresAtStr =
    jar.get("ms_expires_at")?.value ||
    (tokenSet?.expires_at != null ? String(tokenSet.expires_at) : undefined);
  let expiresAt = expiresAtStr ? Number(expiresAtStr) : undefined;

  const now = Date.now();
  const isExpiringSoon = expiresAt != null && now > expiresAt - EXPIRY_SKEW_MS;
  const shouldRefresh = Boolean(
    refreshToken && (!accessToken || isExpiringSoon)
  );

  if (shouldRefresh) {
    try {
      const config = getMicrosoftConfig();
      const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken!,
        scope: MICROSOFT_SCOPES.join(" "),
      });

      const res = await fetch(config.tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (res.ok) {
        const data = await res.json();
        accessToken = data.access_token || accessToken;
        refreshToken = data.refresh_token || refreshToken;
        expiresAt =
          data.expires_in != null
            ? now + data.expires_in * 1000
            : expiresAt;

        const cookieOptions = {
          httpOnly: true as const,
          sameSite: "lax" as const,
          path: "/",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7,
        };
        if (accessToken)
          jar.set("ms_access_token", accessToken, cookieOptions);
        if (refreshToken)
          jar.set("ms_refresh_token", refreshToken, cookieOptions);
        if (expiresAt)
          jar.set("ms_expires_at", String(expiresAt), cookieOptions);

        if (sessionId) {
          saveMsTokenSet(sessionId, {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt,
          });
        }
      }
    } catch {
      // If refresh fails, fall through and return whatever we have
    }
  }

  return { accessToken, refreshToken, expiresAt };
}
