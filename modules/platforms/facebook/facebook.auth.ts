import type { TokenPair } from "@/shared/types";

const AUTHORIZE_URL = "https://www.facebook.com/v21.0/dialog/oauth";
const TOKEN_URL = "https://graph.facebook.com/v21.0/oauth/access_token";

export function getFacebookAuthUrl(redirectUri: string, clientId: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "pages_manage_posts,pages_read_engagement",
    response_type: "code",
  });
  if (state) {
    params.set("state", state);
  }
  return `${AUTHORIZE_URL}?${params}`;
}

export async function handleFacebookCallback(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenPair> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`${TOKEN_URL}?${params}`);
  const data = await res.json();
  if (data.error) {
    throw new Error(`Facebook OAuth error: ${data.error.message}`);
  }
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + (data.expires_in || 5184000) * 1000),
    scopes: ["pages_manage_posts", "pages_read_engagement"],
    tokenType: "long-lived",
  };
}
