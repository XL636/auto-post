import type { TokenPair } from "@/shared/types";

const AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

export function getLinkedInAuthUrl(redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: "openid profile w_member_social",
  });
  if (state) {
    params.set("state", state);
  }
  return `${AUTHORIZE_URL}?${params}`;
}

export async function handleLinkedInCallback(
  code: string,
  redirectUri: string,
): Promise<TokenPair> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`LinkedIn OAuth error: ${data.error_description}`);
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    scopes: (data.scope || "").split(" "),
    tokenType: "long-lived",
  };
}
