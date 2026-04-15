import { createHash, randomBytes } from "crypto";
import type { TokenPair } from "@/shared/types";

const AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const TWITTER_SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];

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

function getTwitterClientAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
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

  return errorData.error_description || errorData.detail || errorData.title || errorData.error || fallback;
}

export interface TwitterAuthRequest {
  url: string;
  codeVerifier: string;
  state: string;
}

export function createTwitterAuthRequest(redirectUri: string, clientId: string): TwitterAuthRequest {
  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  const state = createState();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
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

export function getTwitterAuthUrl(redirectUri: string, clientId: string): string {
  return createTwitterAuthRequest(redirectUri, clientId).url;
}

export async function handleTwitterCallback(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
  codeVerifier?: string,
): Promise<TokenPair> {
  const resolvedCodeVerifier = codeVerifier;

  if (!resolvedCodeVerifier) {
    throw new Error("Twitter OAuth error: missing PKCE verifier. Start the connection again.");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: getTwitterClientAuthHeader(clientId, clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: resolvedCodeVerifier,
      client_id: clientId,
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

export async function refreshTwitterToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenPair> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: getTwitterClientAuthHeader(clientId, clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
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
