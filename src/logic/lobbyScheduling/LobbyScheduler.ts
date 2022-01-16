import { GuildChannelManager, NewsChannel, TextChannel } from "discord.js";
import { lobbyTypes } from "../../misc/constants";
import { scheduleTypes } from "../../misc/types/scheduleTypes";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import {
  beginnerRoles,
  getRegionalRoleFromRegionName,
  getRegionalRoleLobbyChannel,
  getRegionalRoleTimeZoneName,
  tryoutRole,
} from "../discord/roleManagement";
import { PostLobbyOptions } from "../lobby/interfaces/PostLobbyOptions";
import { LobbyPostManipulator } from "../lobby/LobbyPostManipulator";
import { Schedule } from "../serializables/schedule";
import { ScheduleSerializer } from "../serializers/ScheduleSerializer";
import { SerializeUtils } from "../serializers/SerializeUtils";
import { ITime } from "../time/interfaces/Time";
import { TimeConverter } from "../time/TimeConverter";
import { getTimeString, getZonedTimeFromTimeZoneName } from "../time/timeZone";

export class LobbyScheduler {
  private readonly channelManager: GuildChannelManager;
  private readonly dbClient: DFZDataBaseClient;

  private constructor(
    channelManager: GuildChannelManager,
    dbClient: DFZDataBaseClient
  ) {
    this.channelManager = channelManager;
    this.dbClient = dbClient;
  }

  /**
   * Inserts all lobbies due in the next x hours that havent been posted yet
   */
  public static async insertScheduledLobbies(
    channels: GuildChannelManager,
    dbClient: DFZDataBaseClient
  ) {
    const scheduler = new LobbyScheduler(channels, dbClient);
    return scheduler.insertScheduledLobbiesInt();
  }

  private async insertScheduledLobbiesInt() {
    const gdbc = SerializeUtils.fromGuildtoGuildDBClient(
      this.channelManager.guild,
      this.dbClient
    );
    const serializer = new ScheduleSerializer(gdbc);
    const schedules = await serializer.get();

    for (const schedule of schedules) {
      if (!this.shouldPostScheduleLobby(schedule)) continue;
      schedule.lobbyPosted = true;
      await this.createScheduledLobby(schedule);
      await serializer.update(schedule);
    }
  }

  private shouldPostScheduleLobby(schedule: Schedule) {
    if (schedule.coaches.length === 0)
      // only post lobbies for which we have coaches
      return false;

    if (schedule.lobbyPosted)
      // dont double post
      return false;

    var now = Date.now();
    var diff = Number(schedule.date) - now;
    if (diff < 0)
      // dont post lobbies that are in the past
      return false;

    const lobbyPostTime = TimeConverter.hToMs * 5; // at the moment 5 hours
    if (diff > lobbyPostTime)
      // dont post lobbies that are too far in the future
      return false;

    return true;
  }

  private async createScheduledLobby(schedule: Schedule) {
    const regionRole = getRegionalRoleFromRegionName(schedule.region);
    const type = this.getLobbyType(schedule);
    const beginnerRoles = this.getLobbyBeginnerRoles(type, schedule.type);
    const channel = await this.getChannel(schedule, type, regionRole);

    const timezoneName = getRegionalRoleTimeZoneName(regionRole),
      zonedTime = getZonedTimeFromTimeZoneName(
        Number(schedule.date),
        timezoneName
      );

    var options: PostLobbyOptions = {
      type: type,
      regionRole: regionRole,
      userRoles: beginnerRoles,
      time: zonedTime,
      coaches: schedule.coaches,
      optionalText: "",
      guildId: this.channelManager.guild.id,
    };

    await LobbyPostManipulator.postLobby_deprecated(
      this.dbClient,
      channel,
      options
    );

    this.informCoachesOfSchedulePost(schedule, channel, zonedTime);
  }

  private getLobbyType(schedule: Schedule) {
    if (schedule.type === scheduleTypes.tryout) {
      return lobbyTypes.tryout;
    }
    if (schedule.type === scheduleTypes.botbash) {
      return lobbyTypes.botbash;
    }
    if (schedule.coachCount === 2 && schedule.coaches.length > 1) {
      return lobbyTypes.inhouse;
    }
    return lobbyTypes.unranked;
  }

  private async getChannel(
    schedule: Schedule,
    type: number,
    regionRole: string
  ): Promise<TextChannel | NewsChannel> {
    const channelId = this.getScheduledLobbyChannelId(
      type,
      schedule.type,
      regionRole
    );
    const channel = await this.channelManager.fetch(channelId ? channelId : "");
    if (!channel || !channel.isText()) {
      throw new Error("Could not find channel for schedule");
    }
    return channel;
  }

  private getScheduledLobbyChannelId(
    lobbyType: number,
    scheduleType: string,
    lobbyRegionRole: string | undefined
  ): string | undefined {
    switch (lobbyType) {
      case lobbyTypes.tryout:
        return process.env.BOT_LOBBY_CHANNEL_TRYOUT;
      case lobbyTypes.botbash:
        return process.env.BOT_LOBBY_CHANNEL_BOTBASH;
      default:
        if (scheduleType === scheduleTypes.lobbyt3)
          return process.env.BOT_LOBBY_CHANNEL_T3;
        else return getRegionalRoleLobbyChannel(lobbyRegionRole);
    }
  }

  private getLobbyBeginnerRoles(lobbyType: number, scheduleType: string) {
    switch (lobbyType) {
      case lobbyTypes.tryout:
        return [tryoutRole];
      case lobbyTypes.botbash:
        return beginnerRoles.slice(0, 2);
      default:
        if (scheduleType === scheduleTypes.lobbyt3)
          return beginnerRoles.slice(3, 5);
        else return beginnerRoles.slice(1, 3);
    }
  }

  private async informCoachesOfSchedulePost(
    schedule: Schedule,
    channel: TextChannel | NewsChannel,
    zonedTime: ITime
  ) {
    schedule.coaches.forEach(async (coachId) => {
      const coach = await channel.guild.members.fetch(coachId);
      coach.send(
        `I just posted tonight's ${
          schedule.region
        } lobby starting *${getTimeString(zonedTime)}*.\nYou are coaching 👍`
      );
    });
  }
}
