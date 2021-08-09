import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";

module.exports = async (client: DFZDiscordClient) => {
  await client.onReady();
  console.log("Ready at " + new Date().toLocaleString());
};
