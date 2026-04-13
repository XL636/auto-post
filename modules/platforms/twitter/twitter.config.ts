import type { PlatformConfig } from "../platform.interface";

type TwitterPlatformConfig = PlatformConfig & {
  platform: "TWITTER";
  maxContentLength: number;
  supportedMedia: string[];
  maxMediaCount: number;
  rateLimit: {
    requests: number;
    period: "month";
  };
};

export const twitterConfig = {
  name: "Twitter",
  platform: "TWITTER",
  maxContentLength: 280,
  supportedMedia: ["image/jpeg", "image/png", "image/gif", "video/mp4"],
  maxMediaCount: 4,
  rateLimit: {
    requests: 1500,
    period: "month",
  },
  maxChars: 280,
  maxImages: 4,
  maxVideos: 1,
  supportsTextOnly: true,
  requiresMedia: false,
} satisfies TwitterPlatformConfig;
