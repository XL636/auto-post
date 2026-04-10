import type { TokenPair } from "@/shared/types";

const AUTHORIZE_URL = "https://www.reddit.com/api/v1/authorize";
const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";

export function getRedditAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.REDDIT_CLIENT_ID!,
    response_type: "code",
    state: Math.random().toString(36).substring(7),
    redirect_uri: redirectUri,
    duration: "permanent",
    scope: "submit read identity",
  });
  return `${AUTHORIZE_URL}?${params}`;
}

export async function handleRedditCallback(
  code: string,
  redirectUri: string,
): Promise<TokenPair> {
  const auth = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`,
  ).toString("base64");

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
  if (data.error) throw new Error(`Reddit OAuth error: ${data.error}`);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scopes: (data.scope || "").split(" "),
    tokenType: "bearer",
  };
}
