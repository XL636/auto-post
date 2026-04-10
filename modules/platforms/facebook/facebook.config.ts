import type { PlatformConfig } from "../platform.interface";

export const facebookConfig: PlatformConfig = {
  name: "Facebook",
  maxChars: 63206,
  maxImages: 10,
  maxVideos: 1,
  supportsTextOnly: true,
  requiresMedia: false,
};
