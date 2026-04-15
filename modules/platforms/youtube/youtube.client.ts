import type { Account } from "@prisma/client";
import type { PlatformClient } from "../platform.interface";
import type { PublishResult, AnalyticsData, UserProfile, TokenPair } from "@/shared/types";
import { getYouTubeAuthUrl, handleYouTubeCallback, refreshYouTubeAccessToken } from "./youtube.auth";
import { registerPlatform } from "../registry";
import { toErrorMessage } from "@/shared/lib/error";
import { youtubeConfig } from "./youtube.config";
import { requirePlatformCredential } from "@/modules/platform-credentials/credential.service";

const API_BASE = "https://www.googleapis.com/youtube/v3";

function resolveMediaUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return new URL(url, process.env.NEXT_PUBLIC_APP_URL).toString();
}

export class YouTubeClient implements PlatformClient {
  constructor(private account: Account) {}

  async getAuthUrl(redirectUri: string): Promise<string> {
    const credentials = await requirePlatformCredential("YOUTUBE", this.account.userId);
    return getYouTubeAuthUrl(redirectUri, credentials.clientId || "");
  }

  async handleCallback(code: string, redirectUri: string): Promise<TokenPair> {
    const credentials = await requirePlatformCredential("YOUTUBE", this.account.userId);
    return handleYouTubeCallback(
      code,
      redirectUri,
      credentials.clientId || "",
      credentials.clientSecret || "",
    );
  }

  async refreshToken(): Promise<TokenPair> {
    if (!this.account.refreshToken) {
      throw new Error("No refresh token available");
    }

    const credentials = await requirePlatformCredential("YOUTUBE", this.account.userId);
    return refreshYouTubeAccessToken(
      this.account.refreshToken,
      credentials.clientId || "",
      credentials.clientSecret || "",
    );
  }

  async publish(content: string, mediaUrls: string[] = []): Promise<PublishResult> {
    if (mediaUrls.length === 0) {
      return {
        success: false,
        error: "YouTube requires a video file to publish. Text-only posts are not supported by the YouTube API.",
      };
    }

    try {
      const videoUrl = resolveMediaUrl(mediaUrls[0]);
      const metadata = {
        snippet: {
          title: content.substring(0, 100) || "Untitled",
          description: content,
          categoryId: "22",
        },
        status: {
          privacyStatus: "public",
          selfDeclaredMadeForKids: false,
        },
      };

      const initRes = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.account.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(metadata),
        },
      );

      if (!initRes.ok) {
        const errData = await initRes.json().catch(() => null);
        return {
          success: false,
          error:
            (errData as { error?: { message?: string } })?.error?.message ||
            `YouTube upload init failed (${initRes.status})`,
        };
      }

      const uploadUrl = initRes.headers.get("location");
      if (!uploadUrl) {
        return { success: false, error: "YouTube did not return an upload URL" };
      }

      const videoRes = await fetch(videoUrl);
      if (!videoRes.ok) {
        return { success: false, error: `Failed to fetch video from: ${videoUrl}` };
      }

      const videoBuffer = await videoRes.arrayBuffer();
      const contentType = videoRes.headers.get("content-type") || "video/mp4";
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(videoBuffer.byteLength),
        },
        body: videoBuffer,
      });
      const uploadData = await uploadRes.json().catch(() => null);

      if (!uploadRes.ok) {
        return {
          success: false,
          error:
            (uploadData as { error?: { message?: string } })?.error?.message ||
            "YouTube video upload failed",
        };
      }

      return { success: true, platformPostId: (uploadData as { id?: string })?.id };
    } catch (error) {
      return { success: false, error: toErrorMessage(error, "YouTube publish failed") };
    }
  }

  async pollPublishStatus(videoId: string): Promise<PublishResult> {
    try {
      const res = await fetch(`${API_BASE}/videos?part=status,processingDetails&id=${videoId}`, {
        headers: { Authorization: `Bearer ${this.account.accessToken}` },
      });

      if (!res.ok) {
        return { success: false, error: "Failed to check video status" };
      }

      const data = await res.json();
      const video = data.items?.[0];

      if (!video) {
        return { success: false, error: "Video not found" };
      }

      const processingStatus = video.processingDetails?.processingStatus;
      const uploadStatus = video.status?.uploadStatus;

      if (uploadStatus === "processed" || processingStatus === "succeeded") {
        return { success: true, platformPostId: videoId };
      }

      if (uploadStatus === "failed" || processingStatus === "failed") {
        const reason = video.processingDetails?.processingFailureReason || "Processing failed";
        return { success: false, error: `YouTube processing failed: ${reason}` };
      }

      return { success: false, error: "processing" };
    } catch (error) {
      return { success: false, error: toErrorMessage(error, "Failed to poll YouTube status") };
    }
  }

  async deletePost(platformPostId: string): Promise<void> {
    console.warn(`YouTube post deletion not supported via API: ${platformPostId}`);
  }

  async getAnalytics(platformPostId: string): Promise<AnalyticsData> {
    try {
      const res = await fetch(`${API_BASE}/videos?part=statistics&id=${platformPostId}`, {
        headers: { Authorization: `Bearer ${this.account.accessToken}` },
      });
      if (!res.ok) {
        return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
      }
      const data = await res.json();
      const stats = data.items?.[0]?.statistics;
      if (!stats) {
        return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
      }
      return {
        likes: parseInt(stats.likeCount || "0", 10),
        comments: parseInt(stats.commentCount || "0", 10),
        shares: 0,
        impressions: parseInt(stats.viewCount || "0", 10),
        clicks: 0,
      };
    } catch {
      return { likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/channels?part=snippet&mine=true`, {
      headers: { Authorization: `Bearer ${this.account.accessToken}` },
    });
    const data = await res.json();
    const channel = data.items?.[0];
    return {
      platformUserId: channel?.id || "",
      displayName: channel?.snippet?.title || "YouTube Channel",
      avatarUrl: channel?.snippet?.thumbnails?.default?.url,
    };
  }
}

registerPlatform("YOUTUBE", (account) => new YouTubeClient(account), youtubeConfig);
