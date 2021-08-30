import { MessageEmbed, Message, TextBasedChannels } from "discord.js";
import {
  getCoachCountByLobbyType,
  getLobbyNameByType,
  getLobbyPostNameByType,
  getPlayersPerLobbyByLobbyType,
  isRoleBasedLobbyType,
  lobbyTypes,
} from "../../misc/constants";
import { LobbyPlayer } from "./interfaces/LobbyPlayer";
import { createLobbyPostReactions } from "../../misc/messageHelper";
import {
  getRoleMentions,
  getRoleMention,
  getRegionalRoleString,
} from "../../misc/roleManagement";
import { getTimeString } from "../time/timeZone";
import { createTeams } from "../../misc/userHelper";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { EmbeddingCreator } from "../discord/EmbeddingCreator";
import { Lobby } from "../serializables/lobby";
import { LobbySerializer } from "../serializers/lobbySerializer";
import { LobbyFetchResult } from "./interfaces/LobbyFetchResult";
import { PostLobbyOptions } from "./interfaces/PostLobbyOptions";
import { IRemainingTime } from "./interfaces/RemainingTime";
import { TeamsTableGenerator } from "./TeamTableGenerator";
import { UserTableGenerator } from "./UserTableGenerator";

/**
 * Does all the work regarding updating / creating lobby posts in discord channels
 */
export class LobbyPostManipulator {
  public static async postLobby(
    dbClient: DFZDataBaseClient,
    channel: TextBasedChannels,
    options: PostLobbyOptions
  ) {
    var title = this.createLobbyPostTitle(options);
    var text = LobbyPostManipulator.getLobbyPostText(
      options.userRoles,
      options.type,
      options.regionRole,
      options.coaches
    );
    var footer = this.getLobbyPostFooter(options.type, options.regionRole);

    // send embedding post to lobby signup-channel
    const _embed = EmbeddingCreator.create(title, text, footer);
    const lobbyPostMessage = await channel.send({
      content: getRoleMentions(options.userRoles),
      embeds: [_embed],
    }); // mentioning roles in message again to ping beginners

    // pin message to channel
    lobbyPostMessage.pin();

    // add emojis
    createLobbyPostReactions(options.type, lobbyPostMessage);

    // create lobby data in database
    const serializer = new LobbySerializer(dbClient);
    serializer.insert(
      new Lobby(
        options.type,
        options.time.epoch,
        options.coaches,
        options.userRoles,
        options.regionRole,
        channel.id,
        lobbyPostMessage.id
      )
    );
  }

  private static createLobbyPostTitle(options: PostLobbyOptions) {
    return `We host ${getLobbyPostNameByType(options.type)} on ${getTimeString(
      options.time
    )} ${options.time.zone ? options.time.zone.abbreviation : ""}${
      options.optionalText !== "" ? "\nTopic: " + options.optionalText : ""
    }`;
  }

  private static getLobbyPostFooter(type: number, regionRole: string) {
    var res = "";
    if (isRoleBasedLobbyType(type)) {
      res += `${footerStringBeginner} \n\nPlayers from ${getRegionalRoleString(
        regionRole
      )}-region will be moved up.`;
    } else if (type === lobbyTypes.tryout) {
      res += footerStringTryout;
    } else if (type === lobbyTypes.meeting) {
      res += footerStringMeeting;
    } else if (type === lobbyTypes.replayAnalysis)
      res += footerStringReplayAnalysis;

    if (type === lobbyTypes.meeting) {
      res += "\n\nMeeting chair:";
    } else res += "\n\nCoaches:";
    res += " Lock and start lobby with 🔒, cancel with ❌";
    return res;
  }

  public static async cancelLobbyPost(
    lobby: Lobby,
    channel: TextBasedChannels,
    reason: string = ""
  ) {
    this.tryUpdateLobbyPostTitle(
      lobby.messageId,
      channel,
      "[⛔ Lobby cancelled! 😢]\n" +
        `${reason !== "" ? `Reason: ${reason}` : ""}`
    );
  }

  public static async tryUpdateLobbyPostTitle(
    messageId: string,
    channel: TextBasedChannels,
    titleUpdate: string,
    unpin = true
  ) {
    try {
      this.updateLobbyPostTitle(messageId, channel, titleUpdate, unpin);
    } catch (e) {
      console.log(`Error in updateLobbyPostTitle:\n${e}`);
    }
  }

  private static async updateLobbyPostTitle(
    messageId: string,
    channel: TextBasedChannels,
    titleUpdate: string,
    unpin = true
  ) {
    const message = await channel.messages.fetch(messageId);
    if (unpin === true) message.unpin();
    const newEmbed = this.createEmbedWithNewTitle(message, titleUpdate);
    message.edit({ embeds: [newEmbed] });
  }

  private static createEmbedWithNewTitle(
    message: Message,
    titleUpdate: string
  ): MessageEmbed {
    const old_embed: MessageEmbed = message.embeds[0];
    var newEmbedTitle = titleUpdate + "\n~~" + old_embed.title + "~~";
    if (newEmbedTitle.length > 256) newEmbedTitle = newEmbedTitle.slice(0, 256);

    return new MessageEmbed(old_embed).setTitle(newEmbedTitle);
  }

  public static writeLobbyStartPost(lobby: Lobby, channel: TextBasedChannels) {
    const playersPerLobby = getPlayersPerLobbyByLobbyType(lobby.type);
    this.createLobbyStartPost(lobby, channel, playersPerLobby);
  }

  private static createLobbyStartPost(
    lobby: Lobby,
    channel: TextBasedChannels,
    playersPerLobby: number
  ) {
    var userSets: LobbyPlayer[][] = [];
    var userSet: LobbyPlayer[] = [];

    this.fillUserSets(lobby, playersPerLobby, userSets, userSet);

    if (userSets.length === 0 && userSet.length !== 0) {
      this.postIncompleteTeam(channel, lobby, userSet);
      return;
    }

    this.createAndPostCompleteTeams(channel, lobby, userSets);

    if (userSet.length > 0 && userSet.length < playersPerLobby) {
      this.postBench(channel, userSet);
    }
  }

  private static fillUserSets(
    lobby: Lobby,
    playersPerLobby: number,
    userSets: LobbyPlayer[][],
    userSet: LobbyPlayer[]
  ) {
    for (let i = 0; i < lobby.users.length; i++) {
      // add in batches of lobbyTypePlayerCount
      userSet.push(lobby.users[i]);

      if ((i + 1) % playersPerLobby === 0) {
        userSets.push(userSet);
        userSet = [];
      }
    }
  }

  private static postIncompleteTeam(
    channel: TextBasedChannels,
    lobby: Lobby,
    userSet: LobbyPlayer[]
  ) {
    const title = this.getIncompleteTeamPostTitle(lobby.type);
    const tableGenerator = new UserTableGenerator(userSet, lobby.type, true);
    const _embed = EmbeddingCreator.create(
      title,
      "",
      "",
      tableGenerator.generate()
    );
    channel.send({ embeds: [_embed] });
  }

  private static createAndPostCompleteTeams(
    channel: TextBasedChannels,
    lobby: Lobby,
    userSets: LobbyPlayer[][]
  ) {
    var counter = 0;
    const embeds: MessageEmbed[] = [];
    userSets.forEach((us) => {
      var teams = createTeams(us, lobby.type);
      const tableGenerator = new TeamsTableGenerator(teams, lobby.type, true);
      var teamTable = tableGenerator.generate();

      const _embed = EmbeddingCreator.create(
        this.getCompleteTeamPostTitle(lobby.type, ++counter),
        "",
        "",
        teamTable
      );
      embeds.push(_embed);
    });

    channel.send({ embeds: embeds });
  }

  private static postBench(channel: TextBasedChannels, userSet: LobbyPlayer[]) {
    const _embed = EmbeddingCreator.create(
      "Today's bench",
      "",
      "",
      this.generateBenchTable(userSet)
    );
    channel.send({ embeds: [_embed] });
  }

  private static getIncompleteTeamPostTitle(type: number) {
    if (type === lobbyTypes.tryout) return "Tryout lobby starts now";
    if (type === lobbyTypes.replayAnalysis)
      return "Replay analysis session starts now";
    if (type === lobbyTypes.meeting) return "Meeting starts now";

    return "Not enough players for a lobby but we gotta get going anyway";
  }

  private static getCompleteTeamPostTitle(type: number, counter: number) {
    var res = getLobbyNameByType(type);
    if (type === lobbyTypes.replayAnalysis) res += " session starts now";
    else if (type === lobbyTypes.meeting) res += " starts now";
    else
      res +=
        " lobby #" + counter + (counter == 1 ? " starts now" : " starts later");

    return res;
  }

  private static generateBenchTable(userSet: LobbyPlayer[]) {
    const anyNumberOfPlayers = -1;
    const mentionPlayers = true;
    const tableGenerator = new UserTableGenerator(
      userSet,
      anyNumberOfPlayers,
      mentionPlayers
    );
    return tableGenerator.generate();
  }

  /**
   *  Update lobby post to account for current lobby state
   *  @param lobby lobby state
   *  @param channel message channel
   */
  public static async tryUpdateLobbyPost(
    lobby: Lobby,
    channel: TextBasedChannels
  ) {
    try {
      await this.updateLobbyPost(lobby, channel);
    } catch (e) {
      console.log(`Error in updateLobbyPost: ${e}`);
    }
  }

  private static async updateLobbyPost(
    lobby: Lobby,
    channel: TextBasedChannels
  ) {
    const message = await channel.messages.fetch(lobby.messageId);

    var embed = new MessageEmbed(
      message.embeds.length > 0 ? message.embeds[0] : undefined
    );

    embed.title = this.updateLobbyTypeInPostTitle(lobby, embed);

    embed.description = this.getLobbyPostText(
      lobby.beginnerRoleIds,
      lobby.type,
      lobby.regionId,
      lobby.coaches
    );

    const remainingTime = lobby.calculateRemainingTime();
    const isPrior = remainingTime.totalMs > 0;
    this.updateDescriptionTime(embed.description, remainingTime, isPrior);

    const fields = lobby.getCurrentUsersAsTable(true);
    embed.fields = fields !== undefined ? fields : [];

    await message.edit({ embeds: [embed] });
  }

  private static updateLobbyTypeInPostTitle(lobby: Lobby, embed: MessageEmbed) {
    return (
      `We host ${getLobbyPostNameByType(lobby.type)} on ` +
      embed.title?.split(" on ")[1]
    );
  }

  public static getLobbyPostText(
    lobbyUserRoles: string[],
    lobbyType: number,
    lobbyRegionRole: string,
    coaches: string[]
  ) {
    return (
      "for " +
      getRoleMentions(lobbyUserRoles) +
      this.getCoachMentions(lobbyType, coaches) +
      (isRoleBasedLobbyType(lobbyType)
        ? "\nRegion: " + getRoleMention(lobbyRegionRole)
        : "")
    );
  }

  private static getCoachMentions(
    lobbyType: number,
    coaches: string[]
  ): string {
    const maxCoachCount: number = getCoachCountByLobbyType(lobbyType);
    const coachCount: number = coaches === undefined ? 0 : coaches.length;
    if (coachCount === 0) return "";

    const isMeeting = lobbyType === lobbyTypes.meeting;
    const coachString = isMeeting ? "Chair" : "Coach";
    const coachStringPlural = isMeeting ? "Chairs" : "Coaches";
    return coachCount >= 2 && maxCoachCount === 2
      ? "\n" + `${coachStringPlural}: <@${coaches[0]}>, <@${coaches[1]}>`
      : "\n" + `${coachString}: <@${coaches[0]}>`;
  }

  private static updateDescriptionTime(
    description: string[] | string,
    remainingTime: IRemainingTime,
    isPrior: boolean
  ) {
    const addition = `${
      isPrior
        ? remainingLobbyTimeStartString
        : alreadyStartedLobbyTimeStartString
    }\
    ${remainingTime.hours > 0 ? `${remainingTime.hours}h ` : ""}\
    ${remainingTime.minutes}min ${isPrior ? "" : " ago"}`;

    typeof description === "string"
      ? (description += "\n" + addition)
      : description.push(addition);
  }

  private static pruneEmbedDescription(embed: MessageEmbed): string[] {
    var description = embed.description?.split("\n");
    if (description === undefined || description.length === 0) {
      return [];
    }

    const lastEntry = description[description.length - 1];
    if (
      lastEntry.startsWith(remainingLobbyTimeStartString) ||
      lastEntry.startsWith(alreadyStartedLobbyTimeStartString)
    )
      description.pop();

    return description;
  }

  public static async updateLobbyPostDescription(
    fetchResult: LobbyFetchResult,
    remainingTime: IRemainingTime
  ) {
    var description = this.pruneEmbedDescription(fetchResult.embed);
    this.updateDescriptionTime(
      description,
      remainingTime,
      remainingTime.totalMs > 0
    );

    var new_embed = new MessageEmbed(fetchResult.embed);
    new_embed.description = description.join("\n");

    await fetchResult.message.edit({ embeds: [new_embed] });
  }
}

var footerStringBeginner =
  "Join lobby by clicking 1️⃣, 2️⃣, ... at ingame positions you want.\nClick again to remove a position.\nRemove all positions to withdraw from the lobby.";
var footerStringTryout =
  "Join lobby by clicking ✅ below.\nClick again to withdraw.";
var footerStringReplayAnalysis =
  "Join session by clicking ✅ below.\nClick again to withdraw.";
var footerStringMeeting =
  "Join meeting by clicking ✅ below.\nClick again to withdraw.";

const remainingLobbyTimeStartString = "Time to lobby: ";
const alreadyStartedLobbyTimeStartString = "Lobby started ";
