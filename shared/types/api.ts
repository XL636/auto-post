import type { Platform, PostStatus } from "@prisma/client";

export type AccountHealthStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "MISCONFIGURED"
  | "ERROR";

export interface AccountListItem {
  id: string;
  platform: Platform;
  displayName: string;
  avatarUrl: string | null;
  tokenExpiresAt: string | null;
  scopes: string[];
  createdAt: string;
  linkedPostCount: number;
  status: AccountHealthStatus;
  statusLabel: string;
  canPublish: boolean;
  lastError: string | null;
  lastValidatedAt: string | null;
}

export interface PostPlatformAccountSummary {
  id: string;
  platform: Platform;
  displayName: string;
}

export interface AnalyticsSnapshot {
  id: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
  fetchedAt: string;
}

export interface PostPlatformSummary {
  id: string;
  status: PostStatus;
  platformPostId?: string | null;
  overrideContent?: string | null;
  errorMessage?: string | null;
  publishedAt?: string | null;
  account: PostPlatformAccountSummary;
  analytics?: AnalyticsSnapshot[];
}

export interface PostListItem {
  id: string;
  content: string;
  mediaUrls: string[];
  status: PostStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  platforms: PostPlatformSummary[];
}

export interface AnalyticsTotals {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
}

export interface AnalyticsOverview {
  totals: AnalyticsTotals;
  byPlatform: Record<string, AnalyticsTotals>;
  count: number;
}

export type CalendarData = Record<string, PostListItem[]>;
