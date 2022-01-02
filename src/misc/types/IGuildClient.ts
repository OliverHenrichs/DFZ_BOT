import { Guild } from "discord.js";
import { DFZDiscordClient } from "../../logic/discord/DFZDiscordClient";

export interface IGuildClient {
  client: DFZDiscordClient;
  guild: Guild;
}
