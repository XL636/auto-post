const PLATFORM_COLORS: Record<string, string> = {
  LINKEDIN: "#0A66C2",
  FACEBOOK: "#1877F2",
  DISCORD: "#5865F2",
  REDDIT: "#FF4500",
  TWITTER: "#1DA1F2",
  YOUTUBE: "#FF0000",
  INSTAGRAM: "#E4405F",
  TIKTOK: "#000000",
};

export function PlatformIcon({ platform, size = 20 }: { platform: string; size?: number }) {
  const color = PLATFORM_COLORS[platform] || "#787774";
  return (
    <span
      className="inline-flex items-center justify-center rounded text-white text-xs font-bold"
      style={{ width: size, height: size, backgroundColor: color }}
      title={platform}
    >
      {platform.charAt(0)}
    </span>
  );
}
