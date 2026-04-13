import { beforeAll, describe, expect, it } from "vitest";
import type { Account } from "@prisma/client";

function createAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "acc_1",
    userId: "default",
    platform: "TWITTER",
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

describe("validatePlatformPublishability", () => {
  let validatePlatformPublishability: typeof import("@/modules/posts/publish.service").validatePlatformPublishability;

  beforeAll(async () => {
    process.env.DATABASE_URL ||= "postgresql://postgres:postgres@localhost:5433/autopost";
    ({ validatePlatformPublishability } = await import("@/modules/posts/publish.service"));
  });

  it("rejects empty content", () => {
    expect(validatePlatformPublishability("   ", [], createAccount())).toContain("cannot be empty");
  });

  it("rejects content over platform limit", () => {
    expect(
      validatePlatformPublishability("x".repeat(281), [], createAccount({ platform: "TWITTER" })),
    ).toContain("280");
  });

  it("rejects media on platforms without implemented uploads", () => {
    expect(
      validatePlatformPublishability("hello", ["/uploads/test.jpg"], createAccount({ platform: "REDDIT" })),
    ).toContain("not implemented");
  });
});
