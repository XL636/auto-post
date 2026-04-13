import { createHash, randomBytes } from "crypto";
import type { TokenPair } from "@/shared/types";

const AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const TWITTER_SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];
const PKCE_TTL_MS = 10 * 60 * 1000;

const pkceStore = new Map<string, { codeVerifier: string; expiresAt: number }>();

function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createCodeVerifier(): string {
  return toBase64Url(randomBytes(48));
}

function createCodeChallenge(codeVerifier: string): string {
  return toBase64Url(createHash("sha256").update(codeVerifier).digest());
}

function createState(): string {
  return toBase64Url(randomBytes(24));
}

function storeCodeVerifier(redirectUri: string, codeVerifier: string): void {
  const now = Date.now();

  for (const [key, value] of pkceStore.entries()) {
    if (value.expiresAt <= now) {
      pkceStore.delete(key);
    }
  }

  pkceStore.set(redirectUri, {
    codeVerifier,
    expiresAt: now + PKCE_TTL_MS,
  });
}

function takeStoredCodeVerifier(redirectUri: string): string | undefined {
  const entry = pkceStore.get(redirectUri);
  if (!entry) {
    return undefined;
  }

  pkceStore.delete(redirectUri);

  if (entry.expiresAt <= Date.now()) {
    return undefined;
  }

  return entry.codeVerifier;
}

function getTwitterClientAuthHeader(): string {
  const credentials = `${process.env.X_API_KEY ?? ""}:${process.env.X_API_SECRET ?? ""}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

function getTwitterOAuthError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const errorData = data as {
    error?: string;
    error_description?: string;
    detail?: string;
    title?: string;
  };

  return (
    errorData.error_description ||
    errorData.detail ||
    errorData.title ||
    errorData.error ||
    fallback
  );
}

export interface TwitterAuthRequest {
  url: string;
  codeVerifier: string;
  state: string;
}

export function createTwitterAuthRequest(redirectUri: string): TwitterAuthRequest {
  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  const state = createState();

  storeCodeVerifier(redirectUri, codeVerifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.X_API_KEY!,
    redirect_uri: redirectUri,
    scope: TWITTER_SCOPES.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return {
    url: `${AUTHORIZE_URL}?${params.toString()}`,
    codeVerifier,
    state,
  };
}

export function getTwitterAuthUrl(redirectUri: string): string {
  return createTwitterAuthRequest(redirectUri).url;
}

export async function handleTwitterCallback(
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<TokenPair> {
  const resolvedCodeVerifier = codeVerifier ?? takeStoredCodeVerifier(redirectUri);

  if (!resolvedCodeVerifier) {
    throw new Error("Twitter OAuth error: missing PKCE verifier. Start the connection again.");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: getTwitterClientAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: resolvedCodeVerifier,
      client_id: process.env.X_API_KEY!,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Twitter OAuth error: ${getTwitterOAuthError(data, "Token exchange failed")}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    scopes: (data.scope || TWITTER_SCOPES.join(" ")).split(" "),
    tokenType: data.token_type || "bearer",
  };
}

export async function refreshTwitterToken(refreshToken: string): Promise<TokenPair> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: getTwitterClientAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.X_API_KEY!,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Twitter refresh error: ${getTwitterOAuthError(data, "Token refresh failed")}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    scopes: (data.scope || TWITTER_SCOPES.join(" ")).split(" "),
    tokenType: data.token_type || "bearer",
  };
}
