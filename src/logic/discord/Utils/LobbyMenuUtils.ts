import { userMention } from "@discordjs/builders";
import {
  Interaction,
  InteractionUpdateOptions,
  MessageActionRow,
  SelectMenuInteraction,
} from "discord.js";
import { lobbyTypes } from "../../../misc/constants";
import { findLobbyByMessage } from "../../../misc/messageHelper";
import { IMessageIdentifier } from "../../../misc/types/IMessageIdentifier";
import { LobbyPostManipulator } from "../../lobby/LobbyPostManipulator";
import { Lobby } from "../../serializables/Lobby";
import { KickExecutor } from "../CommandExecutors/KickExecutor";
import { SelectMenuUtils } from "../CommandExecutors/SelectMenuUtils";
import { UpdateExecutor } from "../CommandExecutors/UpdateExecutor";
import { DFZDiscordClient } from "../DFZDiscordClient";
import { ILobbyMenu } from "../interfaces/ILobbyMenu";
import { MenuType } from "../enums/MenuType";
import { SelectorCustomIds } from "../enums/SelectorCustomIds";
import { tryoutRole } from "../RoleManagement";
import { CommonMenuUtils } from "./CommonMenuUtils";

export class LobbyMenuUtils {
  public static async updateLobbyMenu(
    client: DFZDiscordClient,
    selector: SelectMenuInteraction
  ): Promise<InteractionUpdateOptions> {
    const menu = CommonMenuUtils.getMenu(client, selector);
    const lobby = CommonMenuUtils.assertMenuHasLobby(menu);
    switch (menu.type) {
      case MenuType.post:
        return this.updatePostLobbyMenu(selector, lobby);
      case MenuType.update:
        return await this.updateUpdateLobbyMenu(client, selector, lobby);
      case MenuType.kick:
        return await this.updateKickLobbyMenu(client, selector, lobby);
    }
  }

  public static updatePostLobbyMenu(
    selector: SelectMenuInteraction,
    lobby: Lobby
  ): InteractionUpdateOptions {
    switch (selector.customId) {
      case SelectorCustomIds.region:
        this.setLobbyRegion(lobby, selector.values[0]);
        break;
      case SelectorCustomIds.beginner:
      case SelectorCustomIds.beginnerAndAdmins:
        this.setLobbyBeginnerRoles(lobby, selector.values);
        break;
      case SelectorCustomIds.channel:
        this.setLobbyChannel(lobby, selector.values[0]);
        break;
    }
    return this.createInteractionUpdateOptions(lobby);
  }

  public static async updateUpdateLobbyMenu(
    client: DFZDiscordClient,
    selector: SelectMenuInteraction,
    lobby: Lobby
  ): Promise<InteractionUpdateOptions> {
    switch (selector.customId) {
      case SelectorCustomIds.type:
        return this.setLobbyType(client, selector, lobby);
      case SelectorCustomIds.region:
        this.setLobbyRegion(lobby, selector.values[0]);
        break;
      case SelectorCustomIds.beginner:
      case SelectorCustomIds.beginnerAndAdmins:
        this.setLobbyBeginnerRoles(lobby, selector.values);
        break;
    }
    return this.createInteractionUpdateOptions(lobby);
  }

  public static async updateKickLobbyMenu(
    client: DFZDiscordClient,
    selector: SelectMenuInteraction,
    lobby: Lobby
  ): Promise<InteractionUpdateOptions> {
    switch (selector.customId) {
      case SelectorCustomIds.player:
        await lobby.kickPlayers(selector.values);
    }
    return {
      content:
        "Will kick the following players: " +
        selector.values.map((user) => userMention(user)).join(", "),
    };
  }

  public static setLobbyRegion(lobby: Lobby, regionRoleId: string): void {
    lobby.regionId = regionRoleId;
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

  public static setLobbyChannel(lobby: Lobby, channelId: string): void {
    lobby.channelId = channelId;
  }

  public static setLobbyBeginnerRoles(
    lobby: Lobby,
    beginnerRoles: string[]
  ): void {
    lobby.beginnerRoleIds = beginnerRoles;
  }

  public static async createOrUpdateLobbySpecificMenu(
    client: DFZDiscordClient,
    selector: SelectMenuInteraction
  ): Promise<InteractionUpdateOptions> {
    const menu = CommonMenuUtils.getMenu(client, selector);
    switch (menu.type) {
      case MenuType.update:
        return await this.createUpdateLobbyMenu(client, selector, menu);
      case MenuType.kick:
        return await this.createKickMenu(client, selector, menu);
      case MenuType.post:
      default:
        return {};
    }
  }

  static async createKickMenu(
    client: DFZDiscordClient,
    selector: SelectMenuInteraction,
    menu: ILobbyMenu
  ): Promise<InteractionUpdateOptions> {
    console.log("IN create Kick menu");

    const lobby = await LobbyMenuUtils.updateLobbyMenuFromSelector(
      selector,
      client,
      menu
    );

    return await LobbyMenuUtils.getLobbySpecificKickOptions(
      client,
      selector,
      lobby
    );
  }

  public static async createUpdateLobbyMenu(
    client: DFZDiscordClient,
    selector: SelectMenuInteraction,
    menu: ILobbyMenu
  ): Promise<InteractionUpdateOptions> {
    const lobby = await LobbyMenuUtils.updateLobbyMenuFromSelector(
      selector,
      client,
      menu
    );

    return await LobbyMenuUtils.getLobbyTypeSpecificOptions(
      client,
      selector,
      lobby
    );
  }

  public static addOrReplaceLobbyMenu(
    client: DFZDiscordClient,
    selector: SelectMenuInteraction,
    menu: ILobbyMenu
  ) {
    const idx = CommonMenuUtils.getMenuIndex(client, selector.message.id);

    if (idx === -1) {
      client.slashCommandMenus.push(menu);
    } else {
      client.slashCommandMenus[idx] = menu;
    }
  }

  private static async getLobbySpecificKickOptions(
    client: DFZDiscordClient,
    selector: SelectMenuInteraction,
    lobby: Lobby
  ) {
    if (lobby.users.length === 0) {
      throw new Error("No players in lobby to kick.");
    }

    const kickRow = await LobbyMenuUtils.addKickRow(client, selector);
    const kickButtonRow = await KickExecutor.getKickButtonRow(true);

    return {
      components: [kickRow, kickButtonRow],
      content: "Choose players to be kicked:",
    };
  }

  private static async updateLobbyMenuFromSelector(
    selector: SelectMenuInteraction,
    client: DFZDiscordClient,
    menu: ILobbyMenu
  ) {
    if (!selector.guildId) {
      throw new Error("No associated guild");
    }
    const lobbyMessageId = selector.values[0];
    const mId: IMessageIdentifier = {
      messageId: lobbyMessageId,
      channelId: selector.channelId,
      guildId: selector.guildId,
    };

    menu.lobby = await findLobbyByMessage(client.dbClient, mId);
    this.addOrReplaceLobbyMenu(client, selector, menu);
    return menu.lobby;
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

  private static async addKickRow(
    client: DFZDiscordClient,
    interaction: Interaction
  ): Promise<MessageActionRow> {
    return await SelectMenuUtils.addMenuRow(
      client,
      interaction,
      SelectMenuUtils.createKickPlayerSelectMenu
    );
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
