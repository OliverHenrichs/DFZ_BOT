import { channelMention } from "@discordjs/builders";
import {
  CommandInteraction,
  Interaction,
  MessageActionRow,
  MessageSelectMenu,
} from "discord.js";
import { lobbyTypeKeys } from "../../../misc/constants";
import { Lobby } from "../../serializables/lobby";
import { RegionDefinitions } from "../../time/RegionDefinitions";
import { ChannelManager } from "../DFZChannelManager";
import { DFZDiscordClient } from "../DFZDiscordClient";
import { IMenuRowOptions } from "../interfaces/IMenuRowOptions";
import { SelectorCustomIds } from "../interfaces/SelectorCustomIds";
import {
  adminRoles,
  beginnerRoles,
  getAdminRoles,
  getBeginnerRoles,
  getRegionRoles,
} from "../roleManagement";
import { SlashCommandHelper } from "../SlashCommandHelper";

export class SelectMenuUtils {
  public static readonly defaultRegion = RegionDefinitions.regionRoles[0];
  public static readonly defaultBeginnerRole = beginnerRoles[1];
  public static readonly defaultAdminRole = adminRoles[0];

  public static async createChannelOptionsSelectMenu(
    client: DFZDiscordClient,
    _interaction: CommandInteraction
  ) {
    return SlashCommandHelper.createSelectMenu({
      customId: SelectorCustomIds.channel,
      placeHolder: "Choose Channel",
      minValues: 1,
      maxValues: 1,
      selectOptions: await Promise.all(
        ChannelManager.lobbyChannels.map(async (channel) => {
          const option = await SlashCommandHelper.getChannelSelectOptions(
            channel,
            client
          );
          return option;
        })
      ),
    });
  }

  public static async createLobbyTypeSelectMenu(
    _client: DFZDiscordClient,
    _interaction: Interaction
  ) {
    return SlashCommandHelper.createSelectMenu({
      customId: SelectorCustomIds.type,
      placeHolder: "Lobby Type",
      minValues: 1,
      maxValues: 1,
      selectOptions: lobbyTypeKeys.map((type) =>
        SlashCommandHelper.getLobbyTypeSelectOption(type)
      ),
    });
  }

  public static async createRegionRolesSelectMenu(
    client: DFZDiscordClient,
    _interaction: Interaction
  ) {
    let roles = getRegionRoles(client);

    return SlashCommandHelper.createSelectMenu({
      customId: SelectorCustomIds.region,
      placeHolder: "Region Role",
      minValues: 1,
      maxValues: 1,
      selectOptions: roles.map((role) =>
        SlashCommandHelper.getRoleSelectOption(role)
      ),
    });
  }

  public static async createBeginnerRolesSelectMenu(
    client: DFZDiscordClient,
    _interaction: Interaction
  ) {
    let roles = getBeginnerRoles(client);

    return SlashCommandHelper.createSelectMenu({
      customId: SelectorCustomIds.beginner,
      placeHolder: "Beginner Roles",
      minValues: 1,
      maxValues: 5,
      selectOptions: roles.map((role) =>
        SlashCommandHelper.getRoleSelectOption(role)
      ),
    });
  }

  public static async createBeginnerAndAdminRolesSelectMenu(
    client: DFZDiscordClient,
    _interaction: Interaction
  ) {
    let roles = getBeginnerRoles(client).concat(getAdminRoles(client));
    return SlashCommandHelper.createSelectMenu({
      customId: SelectorCustomIds.beginnerAndAdmins,
      placeHolder: "Beginner and Admin Roles",
      minValues: 1,
      selectOptions: roles.map((role) =>
        SlashCommandHelper.getRoleSelectOption(role)
      ),
    });
  }

  public static async createLobbyUpdateSelectMenu(
    client: DFZDiscordClient,
    interaction: Interaction
  ): Promise<MessageSelectMenu> {
    if (!interaction.channelId) {
      throw new Error("The interaction does not provide a channel id");
    }
    const lobbies = await Lobby.getChannelLobbies(
      client.dbClient,
      interaction.channelId
    );

    if (!lobbies || lobbies.length === 0) {
      throw new Error(
        "The channel " +
          channelMention(interaction.channelId) +
          " does not contain a posted lobby."
      );
    }

    return SlashCommandHelper.createSelectMenu({
      customId: SelectorCustomIds.lobby,
      placeHolder: "Lobby to update",
      selectOptions: lobbies.map((lobby) =>
        SlashCommandHelper.getLobbySelectOption(lobby)
      ),
    });
  }

  public static async addMenuRow(
    client: DFZDiscordClient,
    interaction: Interaction,
    menuFunction: (
      client: DFZDiscordClient,
      interaction: Interaction
    ) => Promise<MessageSelectMenu>
  ): Promise<MessageActionRow[]> {
    return this.addMenuRows({
      client,
      interaction,
      menuFunctions: [menuFunction],
    });
  }

  public static async addMenuRows(
    options: IMenuRowOptions
  ): Promise<MessageActionRow[]> {
    return await Promise.all(
      options.menuFunctions.map(async (fun): Promise<MessageActionRow> => {
        const row = await fun(options.client, options.interaction);
        return new MessageActionRow().addComponents(row);
      })
    );
  }
}
