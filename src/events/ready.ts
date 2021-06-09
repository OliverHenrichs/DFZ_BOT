import { DFZDiscordClient } from "../types/DFZDiscordClient";

/**
 * Fetch lobby messages from bot channels on startup
 * and setup all interval tasks
 *
 * @param {DFZDiscordClient} client discord client
 */
module.exports = async (client: DFZDiscordClient) => {
  console.log("In onReady");
  await client.onReady();
  console.log("Ready at " + new Date().toLocaleString());
};
