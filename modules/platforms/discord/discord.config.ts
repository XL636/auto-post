import type { PlatformConfig } from "../platform.interface";

export const discordConfig: PlatformConfig = {
  name: "Discord",
  maxChars: 2000,
  maxImages: 10,
  maxVideos: 1,
  supportsTextOnly: true,
  requiresMedia: false,
};
