import { CommandInteraction, Interaction, MessageActionRow } from "discord.js";
import { DFZDiscordClient } from "../DFZDiscordClient";
import { SlashCommandIds } from "../enums/SlashCommandsIds";
import { MenuType } from "../enums/MenuType";
import { SlashCommandHelper } from "../SlashCommandHelper";
import { AbstractExecutor } from "./AbstractExecutor";

export class KickExecutor extends AbstractExecutor {
  public static async getKickComponents(
    client: DFZDiscordClient,
    interaction: Interaction
  ): Promise<MessageActionRow[]> {
    const chooseLobbyRow = await AbstractExecutor.addChooseLobbyRow(
      client,
      interaction
    );
    const buttonRow = KickExecutor.getKickButtonRow(false);
    return [...chooseLobbyRow, buttonRow];
  }

  public static getKickButtonRow(enabled: boolean) {
    return SlashCommandHelper.addGoAndCancelButtons(
      SlashCommandIds.kick,
      "Kick",
      enabled
    );
  }

  public async execute(
    client: DFZDiscordClient,
    interaction: CommandInteraction
  ): Promise<void> {
    this.fetchChannel(client, interaction);

    const components = await KickExecutor.getKickComponents(
      client,
      interaction
    );

    interaction
      .editReply({
        content: "Choose lobby and kick a player",
        components: components,
      })
      .then((message) => {
        client.slashCommandMenus.push({
          type: MenuType.kick,
          id: message.id,
        });
      });
  }
}
