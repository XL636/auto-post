import type { PlatformConfig } from "../platform.interface";

export const youtubeConfig: PlatformConfig = {
  name: "YouTube",
  maxChars: 5000,
  maxImages: 0,
  maxVideos: 1,
  supportsTextOnly: false,
  requiresMedia: true,
};
