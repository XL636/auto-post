import { describe, it, expect } from "vitest";
import { validateContent } from "@/modules/posts/post.validator";

describe("validateContent", () => {
  it("passes for LinkedIn content within 3000 chars", () => {
    expect(validateContent("Hello LinkedIn!", "LINKEDIN").valid).toBe(true);
  });

  it("fails for Discord content over 2000 chars", () => {
    const result = validateContent("x".repeat(2001), "DISCORD");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("2000");
  });

  it("fails for empty content", () => {
    expect(validateContent("", "LINKEDIN").valid).toBe(false);
  });

  it("passes for Reddit content up to 40000 chars", () => {
    expect(validateContent("x".repeat(40000), "REDDIT").valid).toBe(true);
  });
});
