import { SlashCommandBuilder } from "@discordjs/builders";
import { getLobbyTypeByString, lobbyTypeKeys } from "../../../misc/constants";
import { LobbySerializer } from "../../serializers/lobbySerializer";
import { CalendarDefinitions } from "../../time/CalendarDefinitions";
import { RegionDefinitions } from "../../time/RegionDefinitions";
import { ChannelManager } from "../DFZChannelManager";
import { DFZDiscordClient } from "../DFZDiscordClient";
import { CommandOptionNames } from "../interfaces/CommandOptionNames";
import { namedBeginnerRoles, namedRegionRoles } from "../roleManagement";
import { SlashCommandHelper } from "../SlashCommandHelper";

export class CommandBuilderOptionUtils {
  public static async addFreeTextOption(builder: SlashCommandBuilder) {
    builder.addStringOption((option) =>
      option
        .setName(CommandOptionNames.freeText)
        .setDescription("Free text to describe the meeting / lobby.")
        .setRequired(false)
    );
  }

  public static addTypeOption(builder: SlashCommandBuilder) {
    builder.addNumberOption((option) =>
      option
        .setName(CommandOptionNames.type)
        .setDescription("What type of lobby should be started?")
        .setRequired(true)
        .addChoices(this.getOptionTypeChoices())
    );
  }

  public static async addChannelOption(
    builder: SlashCommandBuilder,
    client: DFZDiscordClient
  ) {
    const channelChoices = await this.getOptionChannelChoices(client);
    builder.addStringOption((option) =>
      option
        .setName(CommandOptionNames.channel)
        .setDescription("In which channel should the lobby be posted?")
        .setRequired(true)
        .addChoices(channelChoices)
    );
  }

  public static addRegionOption(builder: SlashCommandBuilder) {
    builder.addRoleOption((option) =>
      option
        .setName(CommandOptionNames.region)
        .setDescription(
          "What kind of region should the lobby be preferring? If none, then "
        )
        .setRequired(false)
    );
  }

  public static addTierOption(builder: SlashCommandBuilder) {
    builder.addRoleOption((option) =>
      option
        .setName(CommandOptionNames.tier)
        .setDescription(
          "Which tier should the players be in. Use multiple tier options to allow multiple tiers"
        )
        .setRequired(false)
    );
  }

  public static addTimeOption(builder: SlashCommandBuilder) {
    builder
      .addNumberOption((option) =>
        option
          .setName(CommandOptionNames.hour)
          .setRequired(true)
          .setDescription("What hour should the lobby start")
          .addChoices(this.getTimeHourChoices())
      )
      .addNumberOption((option) =>
        option
          .setRequired(true)
          .setName(CommandOptionNames.minute)
          .setDescription("What minute should the lobby start")
          .addChoices(this.getTimeMinuteChoices())
      )
      .addStringOption((sc) =>
        sc
          .setName(CommandOptionNames.timezone)
          .setDescription("Which timezone is the lobby in? Check")
          .setRequired(true)
          .addChoices(this.getTimeZoneChoices())
      );
  }

  public static async addMessageIdOption(
    builder: SlashCommandBuilder,
    client: DFZDiscordClient
  ) {
    const lobbyMessageIDs =
      await CommandBuilderOptionUtils.getAllCurrentLobbyMessages(client);
    builder.addStringOption((option) =>
      option
        .setName(CommandOptionNames.message)
        .setDescription("Give message ID of lobby post")
        .setRequired(true)
        .addChoices(lobbyMessageIDs)
    );
  }

  private static async getAllCurrentLobbyMessages(
    client: DFZDiscordClient
  ): Promise<[name: string, value: string][]> {
    const serializer = new LobbySerializer(client.dbClient);
    const lobbies = await serializer.get();
    return lobbies.map((lobby) => [lobby.messageId, lobby.messageId]);
  }

  private static getOptionTypeChoices() {
    return SlashCommandHelper.getOptionChoices<number>(
      lobbyTypeKeys,
      getLobbyTypeByString
    );
  }

  private static async getOptionChannelChoices(client: DFZDiscordClient) {
    const channelNames = await Promise.all(
      ChannelManager.lobbyChannels.map(async (channelId) => {
        const channel = await ChannelManager.getChannel(client, channelId);
        return channel.name;
      })
    );
    return SlashCommandHelper.createChoiceList<string>(
      channelNames,
      ChannelManager.lobbyChannels
    );
  }

  private static getOptionRegionChoices() {
    return SlashCommandHelper.getOptionChoicesByNamedRole(namedRegionRoles);
  }

  private static getOptionTierChoices() {
    return SlashCommandHelper.getOptionChoicesByNamedRole(namedBeginnerRoles);
  }

  private static getTimeZoneChoices() {
    return SlashCommandHelper.getOptionStringChoices(
      RegionDefinitions.allTimeZoneNames
    );
  }

  private static getTimeMinuteChoices() {
    return SlashCommandHelper.getOptionNumberChoices(
      CalendarDefinitions.minutes
    );
  }

  private static getTimeHourChoices() {
    return SlashCommandHelper.getOptionNumberChoices(CalendarDefinitions.hours);
  }
}
