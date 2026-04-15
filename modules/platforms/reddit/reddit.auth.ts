import type { TokenPair } from "@/shared/types";

const AUTHORIZE_URL = "https://www.reddit.com/api/v1/authorize";
const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";

function createRedditAuthHeader(clientId: string, clientSecret: string): string {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export function getRedditAuthUrl(redirectUri: string, clientId: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    duration: "permanent",
    scope: "submit read identity",
  });
  if (state) {
    params.set("state", state);
  }
  return `${AUTHORIZE_URL}?${params}`;
}

export async function handleRedditCallback(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenPair> {
  const auth = createRedditAuthHeader(clientId, clientSecret);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`Reddit OAuth error: ${data.error}`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scopes: (data.scope || "").split(" "),
    tokenType: "bearer",
  };
}

export async function refreshRedditAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenPair> {
  const auth = createRedditAuthHeader(clientId, clientSecret);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(`Reddit token refresh error: ${data.error}`);
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scopes: (data.scope || "").split(" "),
    tokenType: "bearer",
  };
}
