import type { TokenPair } from "@/shared/types";

const AUTHORIZE_URL = "https://www.facebook.com/v21.0/dialog/oauth";
const TOKEN_URL = "https://graph.facebook.com/v21.0/oauth/access_token";
const FACEBOOK_SCOPES = ["pages_manage_posts", "pages_read_engagement", "pages_show_list"];

export function getFacebookAuthUrl(redirectUri: string, clientId: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: FACEBOOK_SCOPES.join(","),
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
    scopes: FACEBOOK_SCOPES,
    tokenType: "long-lived",
  };
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  picture?: { data?: { url?: string } };
}

export async function getFacebookPages(userAccessToken: string): Promise<FacebookPage[]> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,category,picture&access_token=${userAccessToken}`,
  );
  const data = await res.json();

  if (data.error) {
    throw new Error(`Facebook Pages error: ${data.error.message}`);
  }

  return data.data || [];
}

export async function exchangeLongLivedToken(
  shortLivedToken: string,
  clientId: string,
  clientSecret: string,
): Promise<{ accessToken: string; expiresIn: number }> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`,
  );
  const data = await res.json();

  if (data.error) {
    throw new Error(`Facebook token exchange error: ${data.error.message}`);
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 5184000,
  };
}
