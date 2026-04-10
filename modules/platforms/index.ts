// Side-effect imports: register all platform clients
import "./linkedin/linkedin.client";
import "./facebook/facebook.client";
import "./discord/discord.client";
import "./reddit/reddit.client";

export { getPlatformClient, getPlatformConfig, getRegisteredPlatforms } from "./registry";
