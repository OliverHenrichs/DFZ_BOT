import {
  Interaction,
  InteractionUpdateOptions,
  MessageActionRow,
  MessageComponentInteraction,
  SelectMenuInteraction,
} from "discord.js";
import { lobbyTypes } from "../../misc/constants";
import { findLobbyByMessage } from "../../misc/messageHelper";
import { LobbyPostManipulator } from "../lobby/LobbyPostManipulator";
import { Lobby } from "../serializables/lobby";
import { SelectMenuUtils } from "./CommandExecutors/SelectMenuUtils";
import { UpdateExecutor } from "./CommandExecutors/UpdateExecutor";
import { DFZDiscordClient } from "./DFZDiscordClient";
import { ILobbyMenu } from "./interfaces/ILobbyMenu";
import { LobbyMenuType } from "./interfaces/LobbyMenuType";
import { SelectorCustomIds } from "./interfaces/SelectorCustomIds";
import { tryoutRole } from "./roleManagement";

export class LobbyMenuUtils {
  public static getLobbyMenu(
    client: DFZDiscordClient,
    interaction: MessageComponentInteraction
  ): ILobbyMenu {
    const menu = this.getMenu(client, interaction);
    if (!menu) {
      throw new Error(
        `Could not find pending lobby menu for message interaction ${interaction.message.id}`
      );
    }
    return menu;
  }

  public static async updateLobbyMenu(
    client: DFZDiscordClient,
    selector: SelectMenuInteraction
  ): Promise<InteractionUpdateOptions> {
    const menu = LobbyMenuUtils.getLobbyMenu(client, selector);
    switch (menu.type) {
      case LobbyMenuType.post:
        return this.updatePostLobbyMenu(selector, menu);
      case LobbyMenuType.update:
        return await this.updateUpdateLobbyMenu(client, selector, menu);
    }
  }

  public static updatePostLobbyMenu(
    selector: SelectMenuInteraction,
    menu: ILobbyMenu
  ): InteractionUpdateOptions {
    switch (selector.customId) {
      case SelectorCustomIds.region:
        this.setLobbyRegion(menu, selector.values[0]);
        break;
      case SelectorCustomIds.beginner:
      case SelectorCustomIds.beginnerAndAdmins:
        this.setLobbyBeginnerRoles(menu, selector.values);
        break;
      case SelectorCustomIds.channel:
        this.setLobbyChannel(menu, selector.values[0]);
        break;
    }
    return this.createInteractionUpdateOptions(menu.lobby);
  }

  public static async updateUpdateLobbyMenu(
    client: DFZDiscordClient,
    selector: SelectMenuInteraction,
    menu: ILobbyMenu
  ): Promise<InteractionUpdateOptions> {
    switch (selector.customId) {
      case SelectorCustomIds.type:
        return this.setLobbyType(client, selector, menu.lobby);
      case SelectorCustomIds.region:
        this.setLobbyRegion(menu, selector.values[0]);
        break;
      case SelectorCustomIds.beginner:
      case SelectorCustomIds.beginnerAndAdmins:
        this.setLobbyBeginnerRoles(menu, selector.values);
        break;
    }
    return this.createInteractionUpdateOptions(menu.lobby);
  }

  public static setLobbyRegion(menu: ILobbyMenu, regionRoleId: string): void {
    console.log(
      "Setting lobby region from " + menu.lobby.regionId + " to " + regionRoleId
    );

    menu.lobby.regionId = regionRoleId;
  }

  public static async setLobbyType(
    client: DFZDiscordClient,
    selector: SelectMenuInteraction,
    lobby: Lobby
  ): Promise<InteractionUpdateOptions> {
    const lobbyType = selector.values[0];
    lobby.type = Number(lobbyType);

    switch (lobby.type) {
      case lobbyTypes.tryout:
        lobby.beginnerRoleIds = [tryoutRole];
    }
    return this.getLobbyTypeSpecificOptions(client, selector, lobby);
  }

  public static setLobbyChannel(menu: ILobbyMenu, channelId: string): void {
    menu.lobby.channelId = channelId;
  }

  public static setLobbyBeginnerRoles(
    menu: ILobbyMenu,
    beginnerRoles: string[]
  ): void {
    menu.lobby.beginnerRoleIds = beginnerRoles;
  }

  public static async createOrUpdateLobbySpecificMenu(
    client: DFZDiscordClient,
    selector: SelectMenuInteraction
  ): Promise<InteractionUpdateOptions> {
    const lobbyMessageId = selector.values[0];
    const lobby = await findLobbyByMessage(
      client.dbClient,
      selector.channelId,
      lobbyMessageId
    );

    const menu = {
      type: LobbyMenuType.update,
      lobby: lobby,
      id: selector.message.id,
    };
    this.addOrReplaceLobbyMenu(client, selector, menu);

    return await LobbyMenuUtils.getLobbyTypeSpecificOptions(
      client,
      selector,
      lobby
    );
  }

  private static async getLobbyTypeSpecificOptions(
    client: DFZDiscordClient,
    selector: SelectMenuInteraction,
    lobby: Lobby
  ) {
    const postRows = await LobbyMenuUtils.addUpdateRows(
      client,
      selector,
      lobby.type
    );

    const updateMenu = await UpdateExecutor.getUpdateComponents(
      client,
      selector,
      postRows
    );

    return this.createInteractionUpdateOptions(lobby, updateMenu);
  }

  private static async addUpdateRows(
    client: DFZDiscordClient,
    interaction: Interaction,
    lobbyType: number
  ): Promise<MessageActionRow[] | undefined> {
    switch (lobbyType) {
      case lobbyTypes.inhouse:
      case lobbyTypes.unranked:
      case lobbyTypes.botbash:
      case lobbyTypes.replayAnalysis:
        return LobbyMenuUtils.addStandardUpdateRows(client, interaction);
      case lobbyTypes.meeting:
        return LobbyMenuUtils.addMeetingUpdateRows(client, interaction);
      case lobbyTypes.tryout:
      default:
        return [];
    }
  }

  private static async addStandardUpdateRows(
    client: DFZDiscordClient,
    interaction: Interaction
  ): Promise<MessageActionRow[]> {
    return await SelectMenuUtils.addMenuRows({
      client,
      interaction,
      menuFunctions: [
        SelectMenuUtils.createBeginnerRolesSelectMenu,
        SelectMenuUtils.createRegionRolesSelectMenu,
      ],
    });
  }

  private static async addMeetingUpdateRows(
    client: DFZDiscordClient,
    interaction: Interaction
  ): Promise<MessageActionRow[]> {
    return await SelectMenuUtils.addMenuRows({
      client,
      interaction,
      menuFunctions: [SelectMenuUtils.createBeginnerAndAdminRolesSelectMenu],
    });
  }

  public static addOrReplaceLobbyMenu(
    client: DFZDiscordClient,
    selector: SelectMenuInteraction,
    menu: { type: LobbyMenuType; lobby: Lobby; id: string }
  ) {
    const idx = LobbyMenuUtils.getMenuIndex(client, selector);

    if (idx === -1) {
      client.lobbyMenus.push(menu);
    } else {
      client.lobbyMenus[idx] = menu;
    }
  }

  public static removeMenu(
    client: DFZDiscordClient,
    interaction: MessageComponentInteraction
  ) {
    const idx = LobbyMenuUtils.getMenuIndex(client, interaction);
    if (idx !== -1) client.lobbyMenus.slice(idx, 1);
  }

  private static getMenuIndex(
    client: DFZDiscordClient,
    interaction: MessageComponentInteraction
  ) {
    return client.lobbyMenus.findIndex(
      (menu) => menu.id === interaction.message.id
    );
  }

  public static getMenu(
    client: DFZDiscordClient,
    interaction: MessageComponentInteraction
  ) {
    return client.lobbyMenus.find((menu) => menu.id === interaction.message.id);
  }

  private static createInteractionUpdateOptions(
    lobby: Lobby,
    actionRows?: MessageActionRow[]
  ): InteractionUpdateOptions {
    return {
      embeds: [LobbyPostManipulator.createLobbyEmbedding(lobby)],
      components: actionRows,
      content: "Current Lobby-setup:",
    };
  }
}
