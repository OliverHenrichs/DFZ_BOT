import { MessageComponentInteraction } from "discord.js";
import { Lobby } from "../../serializables/lobby";
import { TimeConverter } from "../../time/TimeConverter";
import { DFZDiscordClient } from "../DFZDiscordClient";
import { ILobbyMenu } from "../interfaces/ILobbyMenu";

export class CommonMenuUtils {
  public static async getMenuLobby(
    client: DFZDiscordClient,
    interaction: MessageComponentInteraction
  ): Promise<Lobby> {
    const menu = CommonMenuUtils.getMenu(client, interaction);
    return CommonMenuUtils.assertMenuHasLobby(menu);
  }

  public static getMenu(
    client: DFZDiscordClient,
    interaction: MessageComponentInteraction
  ): ILobbyMenu {
    const menu = this.findMenu(client, interaction);
    if (!menu) {
      throw new Error(
        `Could not find pending lobby menu for message interaction ${interaction.message.id}`
      );
    }
    return menu;
  }

  private static findMenu(
    client: DFZDiscordClient,
    interaction: MessageComponentInteraction
  ) {
    return CommonMenuUtils.findMenuByMessageId(client, interaction.message.id);
  }

  private static findMenuByMessageId(
    client: DFZDiscordClient,
    messageId: string
  ) {
    return client.lobbyMenus.find((menu) => menu.id === messageId);
  }

  public static assertMenuHasLobby(menu: ILobbyMenu): Lobby {
    const lobby = menu.lobby;
    if (!lobby) throw new Error("Menu has no lobby");
    return lobby;
  }

  public static removeMenu(
    client: DFZDiscordClient,
    interaction: MessageComponentInteraction
  ) {
    CommonMenuUtils.removeMenuByIndex(client, interaction.message.id);
  }

  private static removeMenuByIndex(
    client: DFZDiscordClient,
    messageIndex: string
  ) {
    const idx = CommonMenuUtils.getMenuIndex(client, messageIndex);
    if (idx !== -1) client.lobbyMenus.slice(idx, 1);
  }

  public static getMenuIndex(client: DFZDiscordClient, messageId: string) {
    return client.lobbyMenus.findIndex((menu) => menu.id === messageId);
  }

  public static pushMenu(menu: ILobbyMenu, client: DFZDiscordClient) {
    client.lobbyMenus.push(menu);
    setTimeout(() => {
      console.log("Removing menu " + menu.id);

      CommonMenuUtils.removeMenuByIndex(client, menu.id);
    }, TimeConverter.minToMs);
  }
}
