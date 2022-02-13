import { CommandInteraction, Interaction, MessageActionRow } from "discord.js";
import { DFZDiscordClient } from "../DFZDiscordClient";
import { SlashCommandIds } from "../interfaces/SlashCommandsIds";
import { MenuType } from "../interfaces/MenuType";
import { SlashCommandHelper } from "../SlashCommandHelper";
import { AbstractExecutor } from "./AbstractExecutor";
import { SelectMenuUtils } from "./SelectMenuUtils";

export class UpdateExecutor extends AbstractExecutor {
  public static async getUpdateComponents(
    client: DFZDiscordClient,
    interaction: Interaction,
    typeSpecificRows?: MessageActionRow[]
  ): Promise<MessageActionRow[]> {
    const chooseLobbyRow = await AbstractExecutor.addChooseLobbyRow(
      client,
      interaction
    );

    const hasTypeSpecificRows = typeSpecificRows !== undefined;
    const buttonRow = UpdateExecutor.getUpdateButtonRow(hasTypeSpecificRows);

    if (hasTypeSpecificRows) {
      const typeRow = await UpdateExecutor.addLobbyTypeRow(client, interaction);
      return [...chooseLobbyRow, ...typeRow, ...typeSpecificRows, buttonRow];
    }

    return [...chooseLobbyRow, buttonRow];
  }

  private static async addLobbyTypeRow(
    client: DFZDiscordClient,
    interaction: Interaction
  ): Promise<MessageActionRow[]> {
    return await SelectMenuUtils.addMenuRows({
      client,
      interaction,
      menuFunctions: [SelectMenuUtils.createLobbyTypeSelectMenu],
    });
  }

  private static getUpdateButtonRow(enabled: boolean) {
    return SlashCommandHelper.addGoAndCancelButtons(
      SlashCommandIds.update,
      "Update",
      enabled
    );
  }

  public async execute(
    client: DFZDiscordClient,
    interaction: CommandInteraction
  ): Promise<void> {
    this.fetchChannel(client, interaction);

    const components = await UpdateExecutor.getUpdateComponents(
      client,
      interaction
    );

    interaction
      .editReply({
        content: "Choose lobby and update its parameters",
        components: components,
      })
      .then((message) => {
        client.slashCommandMenus.push({
          type: MenuType.update,
          id: message.id,
        });
      });
  }
}
