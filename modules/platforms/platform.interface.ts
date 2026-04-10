import type { TokenPair, PublishResult, AnalyticsData, UserProfile } from "@/shared/types";

export interface PlatformClient {
  getAuthUrl(redirectUri: string): string;
  handleCallback(code: string, redirectUri: string): Promise<TokenPair>;
  refreshToken(token: string): Promise<TokenPair>;

  publish(content: string, mediaUrls?: string[]): Promise<PublishResult>;
  pollPublishStatus?(jobId: string): Promise<PublishResult>;
  deletePost(platformPostId: string): Promise<void>;

  getAnalytics(platformPostId: string): Promise<AnalyticsData>;
  getUserProfile(): Promise<UserProfile>;
}

export interface PlatformConfig {
  name: string;
  maxChars: number;
  maxImages: number;
  maxVideos: number;
  supportsTextOnly: boolean;
  requiresMedia: boolean;
}
