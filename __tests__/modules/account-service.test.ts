import { beforeAll, describe, expect, it } from "vitest";
import type { Account } from "@prisma/client";

function createAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "acc_1",
    userId: "default",
    platform: "LINKEDIN",
    accessToken: "token",
    refreshToken: null,
    platformUserId: "user_1",
    displayName: "Demo",
    avatarUrl: null,
    tokenExpiresAt: null,
    tokenType: null,
    scopes: [],
    lastError: null,
    lastValidatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("getAccountHealth", () => {
  let getAccountHealth: typeof import("@/modules/accounts/account.service").getAccountHealth;

  beforeAll(async () => {
    process.env.DATABASE_URL ||= "postgresql://postgres:postgres@localhost:5433/autopost";
    ({ getAccountHealth } = await import("@/modules/accounts/account.service"));
  });

  it("marks expired accounts as non-publishable", () => {
    const health = getAccountHealth(
      createAccount({ tokenExpiresAt: new Date(Date.now() - 60_000) }),
    );

    expect(health.status).toBe("EXPIRED");
    expect(health.canPublish).toBe(false);
  });

  it("marks soon-to-expire accounts", () => {
    const health = getAccountHealth(
      createAccount({ tokenExpiresAt: new Date(Date.now() + 30 * 60_000) }),
    );

    expect(health.status).toBe("EXPIRING_SOON");
    expect(health.canPublish).toBe(true);
  });

  it("blocks publish when the last error looks like an auth problem", () => {
    const health = getAccountHealth(createAccount({ lastError: "Token refresh failed" }));

    expect(health.status).toBe("ERROR");
    expect(health.canPublish).toBe(false);
  });
});
