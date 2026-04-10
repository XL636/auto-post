import type { PlatformConfig } from "../platform.interface";

export const redditConfig: PlatformConfig = {
  name: "Reddit",
  maxChars: 40000,
  maxImages: 20,
  maxVideos: 1,
  supportsTextOnly: true,
  requiresMedia: false,
};
