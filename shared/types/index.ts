export type { Platform, PostStatus, Account, Post, PostPlatform, Analytics } from "@prisma/client";

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
  tokenType?: string;
}

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
}

export interface AnalyticsData {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
}

export interface UserProfile {
  platformUserId: string;
  displayName: string;
  avatarUrl?: string;
}
