import { CommandInteraction, Interaction, MessageActionRow } from "discord.js";
import { DFZDiscordClient } from "../DFZDiscordClient";
import { ButtonCustomIds } from "../interfaces/ButtonCustomIds";
import { SlashCommandHelper } from "../SlashCommandHelper";
import { AbstractExecutor } from "./AbstractExecutor";
import { SelectMenuUtils } from "./SelectMenuUtils";

export class UpdateExecutor extends AbstractExecutor {
  public async execute(
    client: DFZDiscordClient,
    interaction: CommandInteraction
  ): Promise<void> {
    const channel = client.channels.cache.find(
      (channel) => channel.id === interaction.channelId
    );

    if (!channel) {
      throw new Error(
        "Could not find a channel. Use this command in the channel that contains the lobby you want to update."
      );
    }

    const components = await UpdateExecutor.getUpdateComponents(
      client,
      interaction
    );

    interaction.editReply({
      content: "Choose lobby and update its parameters",
      components: components,
    });
  }

  public static async getUpdateComponents(
    client: DFZDiscordClient,
    interaction: Interaction,
    typeSpecificRows?: MessageActionRow[]
  ): Promise<MessageActionRow[]> {
    const chooseLobbyRow = await UpdateExecutor.addChooseLobbyRow(
      client,
      interaction
    );
    const buttonRow = UpdateExecutor.getUpdateButtonRow();

    if (typeSpecificRows) {
      const typeRow = await UpdateExecutor.addLobbyTypeRow(client, interaction);
      return [...chooseLobbyRow, ...typeRow, ...typeSpecificRows, buttonRow];
    }

    return [...chooseLobbyRow, buttonRow];
  }

  private static async addChooseLobbyRow(
    client: DFZDiscordClient,
    interaction: Interaction
  ): Promise<MessageActionRow[]> {
    return await SelectMenuUtils.addMenuRows({
      client,
      interaction,
      menuFunctions: [SelectMenuUtils.createLobbyUpdateSelectMenu],
    });
  }

  public static async addLobbyTypeRow(
    client: DFZDiscordClient,
    interaction: Interaction
  ): Promise<MessageActionRow[]> {
    return await SelectMenuUtils.addMenuRows({
      client,
      interaction,
      menuFunctions: [SelectMenuUtils.createLobbyTypeSelectMenu],
    });
  }

  public static getUpdateButtonRow() {
    return SlashCommandHelper.addGoAndCancelButtons(
      ButtonCustomIds.update,
      "Update"
    );
  }
}
