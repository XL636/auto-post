import type { Platform, PlatformCredential } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { decrypt, encrypt } from "@/shared/lib/encryption";
import { getDefaultUserId } from "@/modules/accounts/account.service";
import type {
  PlatformCredentialFieldDefinition,
  PlatformCredentialStatus,
  SavePlatformCredentialInput,
} from "@/shared/types/api";

type CredentialValueMap = Partial<
  Record<"clientId" | "clientSecret" | "botToken" | "webhookUrl", string | undefined>
>;

const OAUTH_PLATFORMS: Platform[] = ["LINKEDIN", "FACEBOOK", "REDDIT", "TWITTER", "YOUTUBE"];
const ALL_PLATFORMS: Platform[] = [
  "LINKEDIN",
  "TWITTER",
  "FACEBOOK",
  "DISCORD",
  "REDDIT",
  "YOUTUBE",
];

const FIELD_DEFINITIONS: Record<Platform, PlatformCredentialFieldDefinition[]> = {
  LINKEDIN: [
    { key: "clientId", label: "Client ID", secret: false },
    { key: "clientSecret", label: "Client Secret", secret: true },
  ],
  TWITTER: [
    { key: "clientId", label: "API Key", secret: false },
    { key: "clientSecret", label: "API Secret", secret: true },
  ],
  FACEBOOK: [
    { key: "clientId", label: "App ID", secret: false },
    { key: "clientSecret", label: "App Secret", secret: true },
  ],
  DISCORD: [
    { key: "botToken", label: "Bot Token", secret: true },
    { key: "webhookUrl", label: "Webhook URL", secret: true },
  ],
  REDDIT: [
    { key: "clientId", label: "Client ID", secret: false },
    { key: "clientSecret", label: "Client Secret", secret: true },
  ],
  YOUTUBE: [
    { key: "clientId", label: "Client ID", secret: false },
    { key: "clientSecret", label: "Client Secret", secret: true },
  ],
  INSTAGRAM: [],
  TIKTOK: [],
};

function getEncryptionKey(): string | undefined {
  return process.env.ENCRYPTION_KEY || undefined;
}

function encryptIfNeeded(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const key = getEncryptionKey();
  return key ? encrypt(value, key) : value;
}

function decryptIfNeeded(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const key = getEncryptionKey();
  if (!key) {
    return value;
  }

  try {
    return decrypt(value, key);
  } catch {
    return value;
  }
}

function getEnvFallback(platform: Platform): CredentialValueMap {
  switch (platform) {
    case "LINKEDIN":
      return {
        clientId: process.env.LINKEDIN_CLIENT_ID || "",
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
      };
    case "TWITTER":
      return {
        clientId: process.env.X_API_KEY || "",
        clientSecret: process.env.X_API_SECRET || "",
      };
    case "FACEBOOK":
      return {
        clientId: process.env.FACEBOOK_APP_ID || "",
        clientSecret: process.env.FACEBOOK_APP_SECRET || "",
      };
    case "REDDIT":
      return {
        clientId: process.env.REDDIT_CLIENT_ID || "",
        clientSecret: process.env.REDDIT_CLIENT_SECRET || "",
      };
    case "YOUTUBE":
      return {
        clientId: process.env.YOUTUBE_CLIENT_ID || "",
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET || "",
      };
    case "DISCORD":
      return {
        botToken: process.env.DISCORD_BOT_TOKEN || "",
        webhookUrl: process.env.DISCORD_WEBHOOK_URL || "",
      };
    default:
      return {};
  }
}

function hasRequiredFields(platform: Platform, values: CredentialValueMap): boolean {
  if (platform === "DISCORD") {
    return Boolean(values.botToken && values.webhookUrl);
  }

  if (OAUTH_PLATFORMS.includes(platform)) {
    return Boolean(values.clientId && values.clientSecret);
  }

  return false;
}

function buildCallbackUrl(platform: Platform): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || platform === "DISCORD") {
    return null;
  }

  if (platform === "TWITTER") {
    return `${appUrl}/api/oauth/twitter/callback`;
  }

  return `${appUrl}/api/oauth/${platform.toLowerCase()}/callback`;
}

function maskConfiguredValue(value?: string): string | null {
  if (!value) {
    return null;
  }

  if (value.length <= 6) {
    return "******";
  }

  return `${value.slice(0, 3)}***${value.slice(-3)}`;
}

function trimCredentialInput(input: SavePlatformCredentialInput): CredentialValueMap {
  return {
    clientId: input.clientId?.trim() || undefined,
    clientSecret: input.clientSecret?.trim() || undefined,
    botToken: input.botToken?.trim() || undefined,
    webhookUrl: input.webhookUrl?.trim() || undefined,
  };
}

export function getPlatformCredentialFields(platform: Platform): PlatformCredentialFieldDefinition[] {
  return FIELD_DEFINITIONS[platform] || [];
}

export async function getCredentialRecord(
  platform: Platform,
  userId = getDefaultUserId(),
): Promise<PlatformCredential | null> {
  return prisma.platformCredential.findUnique({
    where: {
      userId_platform: {
        userId,
        platform,
      },
    },
  });
}

export async function getResolvedPlatformCredential(
  platform: Platform,
  userId = getDefaultUserId(),
): Promise<CredentialValueMap & { source: "database" | "environment" | "missing" }> {
  const record = await getCredentialRecord(platform, userId);
  if (record) {
    const resolved = {
      clientId: decryptIfNeeded(record.clientId),
      clientSecret: decryptIfNeeded(record.clientSecret),
      botToken: decryptIfNeeded(record.botToken),
      webhookUrl: decryptIfNeeded(record.webhookUrl),
      source: "database" as const,
    };

    if (hasRequiredFields(platform, resolved)) {
      return resolved;
    }
  }

  const envFallback = getEnvFallback(platform);
  if (hasRequiredFields(platform, envFallback)) {
    return {
      clientId: envFallback.clientId,
      clientSecret: envFallback.clientSecret,
      botToken: envFallback.botToken,
      webhookUrl: envFallback.webhookUrl,
      source: "environment",
    };
  }

  return { source: "missing" };
}

export async function requirePlatformCredential(
  platform: Platform,
  userId = getDefaultUserId(),
): Promise<CredentialValueMap> {
  const credential = await getResolvedPlatformCredential(platform, userId);
  if (credential.source === "missing") {
    throw new Error(`${platform} credentials are not configured.`);
  }

  return credential;
}

export async function listPlatformCredentialStatuses(
  userId = getDefaultUserId(),
): Promise<PlatformCredentialStatus[]> {
  const records = await prisma.platformCredential.findMany({ where: { userId } });
  const recordMap = new Map(records.map((record) => [record.platform, record]));

  return Promise.all(
    ALL_PLATFORMS.map(async (platform) => {
      const record = recordMap.get(platform) || null;
      const resolved = await getResolvedPlatformCredential(platform, userId);
      const source = resolved.source;

      return {
        platform,
        configured: source !== "missing",
        source,
        fields: getPlatformCredentialFields(platform),
        callbackUrl: buildCallbackUrl(platform),
        configuredValues: {
          clientId: resolved.clientId ?? null,
          clientSecret: resolved.clientSecret ? "********" : null,
          botToken: resolved.botToken ? "********" : null,
          webhookUrl: maskConfiguredValue(resolved.webhookUrl),
        },
        updatedAt: record?.updatedAt?.toISOString() || null,
      } satisfies PlatformCredentialStatus;
    }),
  );
}

export async function savePlatformCredential(
  input: SavePlatformCredentialInput,
  userId = getDefaultUserId(),
): Promise<void> {
  const platform = input.platform;
  const existing = await getResolvedPlatformCredential(platform, userId);
  const payload = trimCredentialInput(input);
  const merged = {
    clientId: payload.clientId ?? existing.clientId,
    clientSecret: payload.clientSecret ?? existing.clientSecret,
    botToken: payload.botToken ?? existing.botToken,
    webhookUrl: payload.webhookUrl ?? existing.webhookUrl,
  } satisfies CredentialValueMap;

  if (!hasRequiredFields(platform, merged)) {
    throw new Error(
      platform === "DISCORD"
        ? "Please provide both Bot Token and Webhook URL."
        : "Please provide both Client ID and Client Secret.",
    );
  }

  await prisma.platformCredential.upsert({
    where: {
      userId_platform: {
        userId,
        platform,
      },
    },
    update: {
      clientId: encryptIfNeeded(merged.clientId),
      clientSecret: encryptIfNeeded(merged.clientSecret),
      botToken: encryptIfNeeded(merged.botToken),
      webhookUrl: encryptIfNeeded(merged.webhookUrl),
    },
    create: {
      userId,
      platform,
      clientId: encryptIfNeeded(merged.clientId),
      clientSecret: encryptIfNeeded(merged.clientSecret),
      botToken: encryptIfNeeded(merged.botToken),
      webhookUrl: encryptIfNeeded(merged.webhookUrl),
    },
  });
}
