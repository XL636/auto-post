// Side-effect imports: register all platform clients
import "./linkedin/linkedin.client";
import "./twitter/twitter.client";
import "./facebook/facebook.client";
import "./discord/discord.client";
import "./reddit/reddit.client";
import "./youtube/youtube.client";

export { getPlatformClient, getPlatformConfig, getRegisteredPlatforms } from "./registry";
