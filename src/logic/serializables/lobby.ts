import {
  TextChannel,
  NewsChannel,
  DMChannel,
  MessageReaction,
  User,
} from "discord.js";
import {
  isSimpleLobbyType,
  tryoutReactionEmoji,
  getReactionEmojiPosition,
  isRoleBasedLobbyType,
  getCoachCountByLobbyType,
} from "../../misc/constants";
import { LobbyPlayer } from "../lobby/interfaces/LobbyPlayer";
import { msToMinutes, msToHours } from "../../misc/timeZone";
import { getUser } from "../../misc/userHelper";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { IFieldElement } from "../discord/interfaces/FieldElement";
import { IRemainingTime } from "../lobby/interfaces/RemainingTime";
import { LobbyPostManipulator } from "../lobby/LobbyPostManipulator";
import { UserTableGenerator } from "../lobby/UserTableGenerator";
import { LobbySerializer } from "../serializers/lobbySerializer";

export class Lobby {
  type: number;
  date: number;
  users: Array<LobbyPlayer>;
  coaches: Array<string>;
  beginnerRoleIds: Array<string>;
  regionId: string;
  channelId: string;
  messageId: string;
  started: boolean = false;

  constructor(
    type: number,
    date: number,
    coaches: Array<string> = [],
    beginnerRoleIds: Array<string> = [],
    regionId: string = "",
    channelId: string = "",
    messageId: string = ""
  ) {
    this.type = type;
    this.date = date;
    this.users = [];
    this.coaches = coaches;
    this.beginnerRoleIds = beginnerRoleIds;
    this.regionId = regionId;
    this.channelId = channelId;
    this.messageId = messageId;
  }

  public calculateRemainingTime(): IRemainingTime {
    var res = {
      totalMs: this.date - Date.now(),
      minutes: -1,
      hours: -1,
    };
    if (res.totalMs > 0) {
      res.minutes = Math.floor((res.totalMs * msToMinutes) % 60);
      res.hours = Math.floor(res.totalMs * msToHours);
    } else {
      res.minutes = Math.floor((-res.totalMs * msToMinutes) % 60);
      res.hours = Math.floor(-res.totalMs * msToHours);
    }

    return res;
  }

  public getCurrentUsersAsTable(mention = false): IFieldElement[] {
    const generator = new UserTableGenerator(this.users, this.type, mention);
    return generator.generate();
  }

  public async updateLobbyPostAndDBEntry(
    channel: TextChannel | NewsChannel | DMChannel,
    dbClient: DFZDataBaseClient
  ) {
    LobbyPostManipulator.tryUpdateLobbyPost(this, channel)
      .then(() => {
        const serializer = new LobbySerializer(dbClient);
        serializer.update(this);
      })
      .catch((err: string) =>
        console.log("Failed updateLobbyPostAndDBEntry: \n" + err)
      );
  }

  /**
   * manages removal of reaction in lobby post (position removal or player removal if last position)
   * @param {Pool} dbHandle
   * @param {MessageReaction} reaction reaction that was removed
   * @param {Lobby} lobby lobby that we look at
   * @param {User} user user who removed the reaction
   */
  public async updatePlayerInLobby(
    dbClient: DFZDataBaseClient,
    reaction: MessageReaction,
    user: User
  ) {
    // check reaction emojis
    var position = -1;

    // for simple lobbies just check '✅'
    if (isSimpleLobbyType(this.type)) {
      if (reaction.emoji.name !== tryoutReactionEmoji) return;
    } else {
      // for role based lobbies check positions
      position = getReactionEmojiPosition(reaction.emoji);
      if (position === 0)
        // if finds none => -1, but function adds one to match with ingame positions 1-5; therefore 0 = -1...
        return;
    }

    // check if lobby contains user
    var lobbyUser: LobbyPlayer | undefined = getUser(this, user.id);
    if (lobbyUser === undefined) return;

    // for simple lobbies, always remove
    var removeUser = true;

    // if positions are relevant, remove positions
    if (isRoleBasedLobbyType(this.type)) {
      // remove user position
      lobbyUser.positions = lobbyUser.positions.filter((_position) => {
        return _position != position;
      });

      // do not remove user if some positions are left
      if (lobbyUser.positions.length !== 0) removeUser = false;
    }

    // remove user if necessary
    if (removeUser === true) {
      var idx = this.users.findIndex((_user) => _user.id == user.id);
      this.users.splice(idx, 1);
    }

    await this.updateLobbyPostAndDBEntry(reaction.message.channel, dbClient);
  }

  /**
   * Adds coach to existing lobby
   * @param {Pool} dbHandle
   * @param {Channel} channel
   * @param {Lobby} lobby
   * @param {string} userId
   * @returns true if successful, false if not
   */
  public async addCoach(
    dbClient: DFZDataBaseClient,
    channel: TextChannel | NewsChannel,
    userId: string
  ) {
    if (this.coaches === undefined) throw "Lobby does not support coaches.";

    const coachCount = getCoachCountByLobbyType(this.type);
    if (this.coaches.length >= coachCount)
      throw "Enough coaches have already signed up.";

    if (this.coaches.find((coach) => coach === userId) !== undefined)
      throw "You are already signed up as a coach.";

    this.coaches.push(userId);

    await this.updateLobbyPostAndDBEntry(channel, dbClient);
  }

  /**
   * Removes coach from existing lobby
   * @param {Pool} dbHandle
   * @param {TextChannel} channel
   * @param {Lobby} lobby
   * @param {string} userId
   * @returns true if successful, false if not
   */
  public async removeCoach(
    dbClient: DFZDataBaseClient,
    channel: TextChannel | NewsChannel,
    userId: string
  ) {
    const coachIndex = this.coaches.findIndex((coach) => coach === userId);
    if (coachIndex === -1) {
      throw "You are not signed up as a coach.";
    }
    this.coaches.splice(coachIndex, 1);

    await this.updateLobbyPostAndDBEntry(channel, dbClient);
  }
}
