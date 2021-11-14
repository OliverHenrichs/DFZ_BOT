import { Interaction, MessageSelectMenu } from "discord.js";
import { DFZDiscordClient } from "../DFZDiscordClient";

export interface IMenuRowOptions {
  client: DFZDiscordClient;
  interaction: Interaction;
  menuFunctions: ((
    client: DFZDiscordClient,
    interaction: Interaction
  ) => Promise<MessageSelectMenu>)[];
}
