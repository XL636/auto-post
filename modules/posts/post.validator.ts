import type { Platform } from "@prisma/client";

const CHAR_LIMITS: Record<Platform, number> = {
  TWITTER: 280,
  LINKEDIN: 3000,
  INSTAGRAM: 2200,
  FACEBOOK: 63206,
  TIKTOK: 2200,
  DISCORD: 2000,
  REDDIT: 40000,
  YOUTUBE: 5000,
};

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateContent(
  content: string,
  platform: Platform | string,
): ValidationResult {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: "Content cannot be empty" };
  }
  const limit = CHAR_LIMITS[platform as Platform];
  if (limit && content.length > limit) {
    return {
      valid: false,
      error: `Content exceeds ${platform} limit of ${limit} characters (got ${content.length})`,
    };
  }
  return { valid: true };
}
