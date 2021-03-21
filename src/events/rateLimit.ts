import { Client, RateLimitData } from "discord.js";

/**
 * Fetch lobby messages from bot channels on startup
 *
 * @param {Discord.Client} client discord client
 */
module.exports = async (client: Client, rateLimitInfo: RateLimitData) => {
  // console.log(rateLimitInfo.timeout);
  // console.log(rateLimitInfo.limit);
  // console.log(rateLimitInfo.method);
  // console.log(rateLimitInfo.path);
  // console.log(rateLimitInfo.route);
};
