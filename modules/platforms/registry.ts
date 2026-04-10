import type { Platform, Account } from "@prisma/client";
import type { PlatformClient, PlatformConfig } from "./platform.interface";

type ClientFactory = (account: Account) => PlatformClient;

const factories = new Map<Platform, ClientFactory>();
const configs = new Map<Platform, PlatformConfig>();

export function registerPlatform(
  platform: Platform,
  factory: ClientFactory,
  config: PlatformConfig,
): void {
  factories.set(platform, factory);
  configs.set(platform, config);
}

export function getPlatformClient(platform: Platform, account: Account): PlatformClient {
  const factory = factories.get(platform);
  if (!factory) throw new Error(`Platform ${platform} not registered`);
  return factory(account);
}

export function getPlatformConfig(platform: Platform): PlatformConfig {
  const config = configs.get(platform);
  if (!config) throw new Error(`Platform config for ${platform} not found`);
  return config;
}

export function getRegisteredPlatforms(): Platform[] {
  return Array.from(factories.keys());
}
