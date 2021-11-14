import { CommandInteraction } from "discord.js";
import { DFZDiscordClient } from "../DFZDiscordClient";

export abstract class AbstractExecutor {
  public abstract execute(
    client: DFZDiscordClient,
    interaction: CommandInteraction
  ): Promise<void>;
}
