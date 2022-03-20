import { Guild } from "discord.js";
import { IGuildClient } from "../../misc/types/IGuildClient";
import { IMessageIdentifier } from "../../misc/types/IMessageIdentifier";
import { scheduleReactionEmojis } from "../../misc/types/scheduleTypes";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { DFZDiscordClient } from "../discord/DFZDiscordClient";
import { Schedule } from "../serializables/Schedule";
import { ScheduleSerializer } from "../serializers/ScheduleSerializer";
import { SerializeUtils } from "../serializers/SerializeUtils";
import { ArbitraryTimeAlgos } from "../time/ArbitraryTimeAlgos";
import { RegionDefinitions } from "../time/RegionDefinitions";
import {
  getScheduledDate,
  NextMondayAndSunday,
  scheduleTimezoneNames_short,
} from "../time/TimeZone";
import { ScheduleWriter } from "./ScheduleWriter";
import { IScheduleData, IScheduleSetup } from "./types/IScheduleSetup";
import { IWeeklyScheduleData } from "./types/IWeeklyScheduleData";
import { weeklyScheduleDatas } from "./WeeklyScheduleDatas";

export class SchedulePoster {
  private readonly guild: Guild;
  private readonly client: DFZDiscordClient;

  private constructor(client: IGuildClient) {
    this.client = client.client;
    this.guild = client.guild;
  }

  public static async postSchedules(client: IGuildClient) {
    const schedulePoster = new SchedulePoster(client);
    await schedulePoster.postSchedulesInt();
  }

  private static verifyAndCompleteArray<T>(arr: Array<T>) {
    const numRegions = RegionDefinitions.regions.length;
    if (arr.length === 1) {
      // one item for each region => duplicate for other regions
      for (let i = 0; i < numRegions - 1; i++) arr.push(arr[0]);
    } else if (arr.length !== numRegions) {
      throw new Error("Array length does not meet region count");
    }
  }

  verifyTimes(times: string[][]) {
    SchedulePoster.verifyAndCompleteArray(times);
  }

  verifyDays(days: number[][]) {
    SchedulePoster.verifyAndCompleteArray(days);
  }

  verifyDayAndTimeLengths(days: number[][], times: string[][]) {
    for (let i = 0; i < RegionDefinitions.regions.length; i++) {
      if (times[i].length !== days[i].length) {
        return false;
      }
    }
    return true;
  }

  private async postSchedulesInt() {
    if (!(await this.weeklyScheduleShouldBePosted())) return;
    await this.addCurrentWeekSchedule();
  }

  private async addCurrentWeekSchedule() {
    const mondayAndSunday: NextMondayAndSunday =
      ArbitraryTimeAlgos.getCurrentMondayAndSundayDate();
    for (const data of weeklyScheduleDatas)
      await this.createSchedules(data, mondayAndSunday);
  }

  private async createSchedules(
    scheduleData: IWeeklyScheduleData,
    monAndSun: NextMondayAndSunday
  ) {
    const channel = await this.guild.channels.fetch(scheduleData.channelId);
    if (channel === null || !channel?.isText()) return;
    const scheduleSetup = this.createScheduleSetup(scheduleData, monAndSun);
    if (!scheduleSetup) return;

    const message = await ScheduleWriter.write(channel, scheduleSetup);
    if (message === undefined) return;

    const scheduleIdentifier: IMessageIdentifier = {
      channelId: channel.id,
      messageId: message.id,
      guildId: this.guild.id,
    };

    this.createSchedulesInDatabase(
      this.client.dbClient,
      scheduleIdentifier,
      scheduleSetup
    );
  }

  private createScheduleSetup(
    weeklyScheduleData: IWeeklyScheduleData,
    monAndSun: NextMondayAndSunday
  ): IScheduleSetup {
    const days = weeklyScheduleData.daysByRegion;
    this.verifyDays(days);
    const times = weeklyScheduleData.timesByRegion;
    this.verifyTimes(times);
    this.verifyDayAndTimeLengths(days, times);
    const scheduleData: IScheduleData[] = this.createScheduleData(days, times);
    return {
      mondayDate: monAndSun.monday,
      sundayDate: monAndSun.sunday,
      data: scheduleData,
      type: weeklyScheduleData.type,
      coachCount: weeklyScheduleData.coachCount,
    };
  }

  private createScheduleData(
    days: number[][],
    times: string[][]
  ): IScheduleData[] {
    return RegionDefinitions.regions.map((region, i) => {
      return {
        days: days[i],
        region: region.name,
        regionString: region.fancyVersion,
        times: times[i],
        timezone: region.timeZoneName,
        timezoneShortName: scheduleTimezoneNames_short[i],
      };
    });
  }

  private createSchedulesInDatabase(
    dbClient: DFZDataBaseClient,
    messageIdentifier: IMessageIdentifier,
    scheduleSetup: IScheduleSetup
  ) {
    const serializer = new ScheduleSerializer(
      SerializeUtils.getGuildDBClient(messageIdentifier.guildId, dbClient)
    );
    let dayBaseIndex = 0;
    scheduleSetup.data.forEach((datum) => {
      this.insertDailyScheduleDatum(
        datum,
        scheduleSetup,
        dayBaseIndex,
        serializer,
        messageIdentifier
      );
      dayBaseIndex += datum.days.length;
    });
  }

  private insertDailyScheduleDatum(
    datum: IScheduleData,
    scheduleSetup: IScheduleSetup,
    dayBaseIndex: number,
    serializer: ScheduleSerializer,
    messageIdentifier: IMessageIdentifier
  ) {
    datum.days.forEach((day, j) => {
      const time = datum.times[j];
      const reactionEmoji = scheduleReactionEmojis[dayBaseIndex + j];
      const date = getScheduledDate(
        scheduleSetup.mondayDate,
        day,
        time,
        datum.timezone
      );
      serializer.insert(
        new Schedule(
          messageIdentifier.guildId,
          messageIdentifier.channelId,
          messageIdentifier.messageId,
          scheduleSetup.type,
          scheduleSetup.coachCount,
          reactionEmoji,
          date?.toString(),
          datum.region
        )
      );
    });
  }

  private async weeklyScheduleShouldBePosted() {
    const schedules = await this.getAllSchedules();
    const { monday } = ArbitraryTimeAlgos.getCurrentMondayAndSundayDate();
    return !this.existsScheduleAfterMonday(schedules, monday);
  }

  private async getAllSchedules() {
    const gdbc = SerializeUtils.fromGuildtoGuildDBClient(
      this.guild,
      this.client.dbClient
    );
    const serializer = new ScheduleSerializer(gdbc);
    return await serializer.get();
  }

  private existsScheduleAfterMonday(schedules: Schedule[], monday: Date) {
    const scheduleAfterMonday = schedules.find(
      (schedule) => monday < new Date(Number(schedule.date))
    );
    return scheduleAfterMonday !== undefined;
  }
}
