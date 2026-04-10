import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "@/shared/lib/encryption";

describe("encryption", () => {
  const testKey = "a".repeat(64);

  it("encrypts and decrypts round-trip", () => {
    const plaintext = "oauth-access-token-12345";
    const encrypted = encrypt(plaintext, testKey);
    expect(encrypted).not.toBe(plaintext);
    expect(decrypt(encrypted, testKey)).toBe(plaintext);
  });

  it("produces different ciphertexts for same plaintext (unique nonce)", () => {
    const plaintext = "same-token";
    expect(encrypt(plaintext, testKey)).not.toBe(encrypt(plaintext, testKey));
  });

  it("fails to decrypt with wrong key", () => {
    const encrypted = encrypt("secret", testKey);
    expect(() => decrypt(encrypted, "b".repeat(64))).toThrow();
  });
});
