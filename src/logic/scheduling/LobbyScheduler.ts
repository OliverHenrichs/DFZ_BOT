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
} from "../discord/RoleManagement";
import { IPostLobbyOptions } from "../lobby/interfaces/IPostLobbyOptions";
import { LobbyPostManipulator } from "../lobby/LobbyPostManipulator";
import { Schedule } from "../serializables/Schedule";
import { ScheduleSerializer } from "../serializers/ScheduleSerializer";
import { SerializeUtils } from "../serializers/SerializeUtils";
import { ITime } from "../time/interfaces/ITime";
import { TimeConverter } from "../time/TimeConverter";
import { getTimeString, getZonedTimeFromTimeZoneName } from "../time/TimeZone";

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
   * Inserts all lobbies due in the next x hours that haven't been posted yet
   */
  public static async insertScheduledLobbies(
    channels: GuildChannelManager,
    dbClient: DFZDataBaseClient
  ) {
    const scheduler = new LobbyScheduler(channels, dbClient);
    return scheduler.insertScheduledLobbiesInt();
  }

  private static shouldPostScheduleLobby(schedule: Schedule) {
    if (schedule.coaches.length === 0)
      // only post lobbies for which we have coaches
      return false;

    if (schedule.lobbyPosted)
      // don't double post
      return false;

    const now = Date.now();
    const diff = Number(schedule.date) - now;
    if (diff < 0)
      // don't post lobbies that are in the past
      return false;

    const lobbyPostTime = TimeConverter.hToMs * 5; // at the moment 5 hours
    return diff <= lobbyPostTime;
  }

  private static getLobbyType(schedule: Schedule) {
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

  private static getScheduledLobbyChannelId(
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

  private static getLobbyBeginnerRoles(
    lobbyType: number,
    scheduleType: string
  ) {
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

  private static async informCoachesOfSchedulePost(
    schedule: Schedule,
    channel: TextChannel | NewsChannel,
    zonedTime: ITime
  ) {
    for (const coachId of schedule.coaches) {
      const coach = await channel.guild.members.fetch(coachId);
      await coach.send(
        `I just posted tonight's ${
          schedule.region
        } lobby starting *${getTimeString(zonedTime)}*.\nYou are coaching 👍`
      );
    }
  }

  private async insertScheduledLobbiesInt() {
    const gdbc = SerializeUtils.fromGuildtoGuildDBClient(
      this.channelManager.guild,
      this.dbClient
    );
    const serializer = new ScheduleSerializer(gdbc);
    const schedules = await serializer.get();

    for (const schedule of schedules) {
      if (!LobbyScheduler.shouldPostScheduleLobby(schedule)) continue;
      schedule.lobbyPosted = true;
      await this.createScheduledLobby(schedule);
      await serializer.update(schedule);
    }
  }

  private async createScheduledLobby(schedule: Schedule) {
    const regionRole = getRegionalRoleFromRegionName(schedule.region);
    const type = LobbyScheduler.getLobbyType(schedule);
    const beginnerRoles = LobbyScheduler.getLobbyBeginnerRoles(
      type,
      schedule.type
    );
    const channel = await this.getChannel(schedule, type, regionRole);

    const timezoneName = getRegionalRoleTimeZoneName(regionRole),
      zonedTime = getZonedTimeFromTimeZoneName(
        Number(schedule.date),
        timezoneName
      );

    const options: IPostLobbyOptions = {
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

    await LobbyScheduler.informCoachesOfSchedulePost(
      schedule,
      channel,
      zonedTime
    );
  }

  private async getChannel(
    schedule: Schedule,
    type: number,
    regionRole: string
  ): Promise<TextChannel | NewsChannel> {
    const channelId = LobbyScheduler.getScheduledLobbyChannelId(
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
}
