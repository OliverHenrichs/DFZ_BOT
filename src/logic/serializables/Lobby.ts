import { MessageReaction, TextBasedChannels, User } from "discord.js";
import {
  getCoachCountByLobbyType,
  getReactionEmojiPosition,
  isRoleBasedLobbyType,
  isSimpleLobbyType,
  tryoutReactionEmoji,
} from "../../misc/constants";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { IFieldElement } from "../discord/interfaces/IFieldElement";
import { ILobbyPlayer } from "../lobby/interfaces/ILobbyPlayer";
import { IRemainingTime } from "../lobby/interfaces/IRemainingTime";
import { LobbyPostManipulator } from "../lobby/LobbyPostManipulator";
import { UserTableGenerator } from "../lobby/UserTableGenerator";
import { LobbySerializer } from "../serializers/LobbySerializer";
import { SerializeUtils } from "../serializers/SerializeUtils";
import { ITime } from "../time/interfaces/ITime";
import { TimeConverter } from "../time/TimeConverter";
import { getZonedTimeFromTimeZoneName } from "../time/TimeZone";
import { Serializable } from "./Serializable";
import { ILobbyOptions } from "./interfaces/ILobbyOptions";

export class Lobby extends Serializable {
  public type: number;
  public date: ITime;
  public users: Array<ILobbyPlayer>;
  public coaches: Array<string>;
  public beginnerRoleIds: Array<string>;
  public regionId: string;
  public channelId: string;
  public messageId: string;
  public started: boolean = false;
  public text: string;

  constructor(options?: ILobbyOptions) {
    super(options ? options.guildId : "");
    if (!options) {
      this.type = -1;
      this.date = getZonedTimeFromTimeZoneName(new Date(), "Europe/Brussels");
      this.users = [];
      this.coaches = [];
      this.beginnerRoleIds = [];
      this.regionId = "";
      this.channelId = "";
      this.messageId = "";
      this.text = "";
      return;
    }

    this.type = options.type;
    this.date = options.date;
    this.users = [];
    this.coaches = options.coaches ? options.coaches : [];
    this.beginnerRoleIds = options.beginnerRoleIds
      ? options.beginnerRoleIds
      : [];
    this.regionId = options.regionId ? options.regionId : "";
    this.channelId = options.channelId ? options.channelId : "";
    this.messageId = options.messageId ? options.messageId : "";
    this.text = options.text ? options.text : "";
  }

  public static async getChannelLobbies(
    dbClient: DFZDataBaseClient,
    guildId: string,
    channelId: string
  ) {
    const gdbc = SerializeUtils.getGuildDBClient(guildId, dbClient);
    const serializer = new LobbySerializer(gdbc, channelId);
    return await serializer.get();
  }

  public calculateRemainingTime(): IRemainingTime {
    const res = {
      totalMs: this.date.epoch - Date.now(),
      minutes: -1,
      hours: -1,
    };
    if (res.totalMs > 0) {
      res.minutes = Math.floor((res.totalMs * TimeConverter.msToMin) % 60);
      res.hours = Math.floor(res.totalMs * TimeConverter.msToHours);
    } else {
      res.minutes = Math.floor((-res.totalMs * TimeConverter.msToMin) % 60);
      res.hours = Math.floor(-res.totalMs * TimeConverter.msToHours);
    }

    return res;
  }

  public getCurrentUsersAsTable(mention = false): IFieldElement[] {
    const generator = new UserTableGenerator(this.users, this.type, mention);
    return generator.generate();
  }

  public async updateLobbyPostAndDBEntry(
    channel: TextBasedChannels,
    dbClient: DFZDataBaseClient
  ) {
    LobbyPostManipulator.tryUpdateLobbyPost(this, channel)
      .then(() => {
        const gdbc = SerializeUtils.getGuildDBClient(this.guildId, dbClient);
        const serializer = new LobbySerializer(gdbc);
        serializer.update(this);
      })
      .catch((err: string) =>
        console.log("Failed updateLobbyPostAndDBEntry: \n" + err)
      );
  }

  // TODO: refactor me (polymorphic, reaction out, ...)
  public async updatePlayerInLobbyDueToReactionRemoval(
    dbClient: DFZDataBaseClient,
    reaction: MessageReaction,
    user: User
  ) {
    const lobbyUser: ILobbyPlayer | undefined = this.getUser(user.id);
    if (lobbyUser === undefined) return;

    let position = -1;

    if (isSimpleLobbyType(this.type)) {
      // for simple lobbies just check '✅'
      if (reaction.emoji.name !== tryoutReactionEmoji) return;
    } else {
      // for role based lobbies check positions
      position = getReactionEmojiPosition(reaction.emoji);
      if (position === 0)
        // if finds none => -1, but function adds one to match with ingame positions 1-5; therefore 0 = -1...
        return;
    }

    if (this.shouldRemoveUser(lobbyUser, position)) {
      const idx = this.users.findIndex((_user) => _user.id == user.id);
      this.users.splice(idx, 1);
    }

    if (!reaction.message.guild) {
      return;
    }

    await this.updateLobbyPostAndDBEntry(reaction.message.channel, dbClient);
  }

  public async addCoach(
    dbClient: DFZDataBaseClient,
    channel: TextBasedChannels,
    userId: string
  ) {
    if (this.coaches === undefined)
      throw new Error("Lobby does not support coaches.");

    const coachCount = getCoachCountByLobbyType(this.type);
    if (this.coaches.length >= coachCount)
      throw new Error("Enough coaches have already signed up.");

    if (this.coaches.find((coach) => coach === userId) !== undefined)
      throw new Error("You are already signed up as a coach.");

    this.coaches.push(userId);

    await this.updateLobbyPostAndDBEntry(channel, dbClient);
  }

  public async removeCoach(
    dbClient: DFZDataBaseClient,
    channel: TextBasedChannels,
    userId: string
  ) {
    const coachIndex = this.coaches.findIndex((coach) => coach === userId);
    if (coachIndex === -1) {
      throw new Error("You are not signed up as a coach.");
    }
    this.coaches.splice(coachIndex, 1);

    await this.updateLobbyPostAndDBEntry(channel, dbClient);
  }

  public getUserIndex(userId: string) {
    return this.users.findIndex((user) => user.id == userId);
  }

  public async kickPlayers(userIDs: string[]) {
    userIDs.forEach((id) => {
      const idx = this.getKickeeIndex(id);
      this.users.splice(idx, 1);
    });
  }

  private getKickeeIndex(userId: string) {
    const kickeeIdx = this.users.findIndex((usr) => usr.id === userId);
    if (kickeeIdx === -1)
      throw new Error("Did not find player to be kicked given the Id.");
    return kickeeIdx;
  }

  private shouldRemoveUser(lobbyUser: ILobbyPlayer, position: number) {
    if (!isRoleBasedLobbyType(this.type)) {
      // for simple lobbies, always remove
      return true;
    }

    // remove user position
    lobbyUser.positions = lobbyUser.positions.filter((_position) => {
      return _position != position;
    });

    // do not remove user if some positions are left
    return lobbyUser.positions.length === 0;
  }

  private getUser(userId: string) {
    return this.users.find((user) => user.id == userId);
  }
}
