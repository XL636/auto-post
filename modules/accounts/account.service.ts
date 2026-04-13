import type { Account } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { decrypt, encrypt } from "@/shared/lib/encryption";
import { getPlatformClient } from "@/modules/platforms";
import type { AccountHealthStatus } from "@/shared/types/api";

const DEFAULT_USER_ID = "default";
const REFRESH_WINDOW_MS = 5 * 60 * 1000;
const EXPIRING_SOON_MS = 24 * 60 * 60 * 1000;

function isBlockingAccountError(message: string): boolean {
  return /(auth|token|unauthori|forbidden|permission|scope|expired|refresh)/i.test(message);
}

function maybeDecryptToken(token: string | null): string | null {
  if (!token) {
    return null;
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    return token;
  }

  try {
    return decrypt(token, encryptionKey);
  } catch {
    return token;
  }
}

function maybeEncryptToken(token: string | null | undefined): string | null {
  if (!token) {
    return null;
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  return encryptionKey ? encrypt(token, encryptionKey) : token;
}

function shouldRefreshAccountToken(account: Account): boolean {
  if (account.platform === "DISCORD" || !account.tokenExpiresAt || !account.refreshToken) {
    return false;
  }

  return account.tokenExpiresAt.getTime() <= Date.now() + REFRESH_WINDOW_MS;
}

export function getDefaultUserId(): string {
  return DEFAULT_USER_ID;
}

export function getLocalizedAccountsPath(locale?: string | null): string {
  return locale ? `/${locale}/accounts` : "/accounts";
}

export function getAccountHealth(
  account: Pick<Account, "platform" | "tokenExpiresAt" | "lastError">,
  hasCredentials = true,
): {
  status: AccountHealthStatus;
  canPublish: boolean;
} {
  const missingCredentials = !hasCredentials;

  if (missingCredentials) {
    return { status: "MISCONFIGURED", canPublish: false };
  }

  if (account.tokenExpiresAt && account.tokenExpiresAt.getTime() <= Date.now()) {
    return { status: "EXPIRED", canPublish: false };
  }

  if (account.lastError) {
    return { status: "ERROR", canPublish: !isBlockingAccountError(account.lastError) };
  }

  if (
    account.tokenExpiresAt &&
    account.tokenExpiresAt.getTime() <= Date.now() + EXPIRING_SOON_MS
  ) {
    return { status: "EXPIRING_SOON", canPublish: true };
  }

  return { status: "ACTIVE", canPublish: true };
}

export function withDecryptedAccountTokens(account: Account): Account {
  return {
    ...account,
    accessToken: maybeDecryptToken(account.accessToken) ?? account.accessToken,
    refreshToken: maybeDecryptToken(account.refreshToken),
  };
}

export async function getAuthorizedAccount(account: Account): Promise<Account> {
  const decryptedAccount = withDecryptedAccountTokens(account);

  if (!shouldRefreshAccountToken(decryptedAccount)) {
    return decryptedAccount;
  }

  try {
    const client = getPlatformClient(decryptedAccount.platform, decryptedAccount);
    const refreshedTokens = await client.refreshToken(decryptedAccount.refreshToken ?? undefined);

    const refreshedAccount = await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: maybeEncryptToken(refreshedTokens.accessToken) ?? account.accessToken,
        refreshToken: maybeEncryptToken(refreshedTokens.refreshToken ?? decryptedAccount.refreshToken),
        tokenExpiresAt: refreshedTokens.expiresAt,
        tokenType: refreshedTokens.tokenType,
        scopes: refreshedTokens.scopes,
        lastError: null,
        lastValidatedAt: new Date(),
      },
    });

    return withDecryptedAccountTokens(refreshedAccount);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Token refresh failed";

    await prisma.account.update({
      where: { id: account.id },
      data: {
        lastError: message,
        lastValidatedAt: new Date(),
      },
    });

    throw error;
  }
}

export async function getAuthorizedPlatformClient(account: Account) {
  const authorizedAccount = await getAuthorizedAccount(account);

  return {
    account: authorizedAccount,
    client: getPlatformClient(authorizedAccount.platform, authorizedAccount),
  };
}

export async function markAccountValidated(accountId: string): Promise<void> {
  await prisma.account.update({
    where: { id: accountId },
    data: {
      lastError: null,
      lastValidatedAt: new Date(),
    },
  });
}

export async function markAccountError(accountId: string, message: string): Promise<void> {
  await prisma.account.update({
    where: { id: accountId },
    data: {
      lastError: message,
      lastValidatedAt: new Date(),
    },
  });
}
