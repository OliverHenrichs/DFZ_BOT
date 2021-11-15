import { CommandInteraction, Interaction, MessageActionRow } from "discord.js";
import { DFZDiscordClient } from "../DFZDiscordClient";
import { SelectMenuUtils } from "./SelectMenuUtils";

export abstract class AbstractExecutor {
  public abstract execute(
    client: DFZDiscordClient,
    interaction: CommandInteraction
  ): Promise<void>;

  public static async addChooseLobbyRow(
    client: DFZDiscordClient,
    interaction: Interaction
  ): Promise<MessageActionRow[]> {
    return await SelectMenuUtils.addMenuRows({
      client,
      interaction,
      menuFunctions: [SelectMenuUtils.createLobbyUpdateSelectMenu],
    });
  }

  protected fetchChannel(
    client: DFZDiscordClient,
    interaction: CommandInteraction
  ): void {
    const channel = client.channels.cache.find(
      (channel) => channel.id === interaction.channelId
    );

    if (!channel) {
      throw new Error(
        "Could not find a channel. Use this command in the channel that contains the lobby you want to update."
      );
    }
  }
}
