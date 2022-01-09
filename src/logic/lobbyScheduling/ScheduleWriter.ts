import { Message, MessageEmbed, TextBasedChannels } from "discord.js";
import { scheduleReactionEmojis } from "../../misc/types/scheduleTypes";
import { EmbeddingCreator } from "../discord/EmbeddingCreator";
import { IFieldElement } from "../discord/interfaces/IFieldElement";
import { ArbitraryTimeAlgos } from "../time/ArbitraryTimeAlgos";
import { CalendarDefinitions } from "../time/CalendarDefinitions";
import { IScheduleFields } from "./types/IScheduleFields";
import { IScheduleData, IScheduleSetup } from "./types/IScheduleSetup";
import {
  IScheduleTestOptions,
  IScheduleTestOptions as IScheduleTextOptions,
} from "./types/IScheduleTextOptions";

/**
 * Posts a schedule to discord channel based on schedule setup.
 */
export class ScheduleWriter {
  private static readonly footer = `If coaches are signed up, the corresponding lobby is automatically created roughly 8h prior to the event.\nIf coaches only sign up shortly before the lobby (4h or less), then they must manually create the lobby.`;
  private static readonly embedText =
    "Sign up as a coach by reacting to the respective number.";

  public static async write(
    channel: TextBasedChannels,
    scheduleSetup: IScheduleSetup
  ): Promise<Message | undefined> {
    const fields = ScheduleWriter.createEmbedFields(scheduleSetup);
    const embed = ScheduleWriter.createEmbeddings(scheduleSetup, fields);
    return await ScheduleWriter.writeSchedule(channel, embed, fields);
  }

  private static createEmbeddings(
    scheduleSetup: IScheduleSetup,
    fields: IScheduleFields
  ) {
    return EmbeddingCreator.create(
      ScheduleWriter.getWeekScheduleString(scheduleSetup),
      ScheduleWriter.embedText,
      ScheduleWriter.footer,
      fields.schedules
    );
  }

  private static createEmbedFields(
    scheduleSetup: IScheduleSetup
  ): IScheduleFields {
    return ScheduleWriter.createScheduleFields(scheduleSetup);
  }

  private static async writeSchedule(
    channel: TextBasedChannels,
    embed: MessageEmbed,
    fields: IScheduleFields
  ): Promise<Message> {
    const message = await channel.send({ embeds: [embed] });
    ScheduleWriter.reactWithScheduleEmojis(
      message,
      fields.lastReactionEmojiIndex
    );
    return message;
  }

  private static createScheduleFields(
    scheduleSetup: IScheduleSetup
  ): IScheduleFields {
    var dayAcronyms = ScheduleWriter.createDayAcronyms(scheduleSetup);
    let lastReactionEmojiIndex = 0;
    const schedules = scheduleSetup.data.map((scheduleDatum, index) => {
      return ScheduleWriter.createScheduleField(
        dayAcronyms[index],
        lastReactionEmojiIndex,
        scheduleDatum,
        scheduleSetup
      );
    });

    return { schedules, lastReactionEmojiIndex };
  }

  private static createScheduleField(
    dayAcronym: string[],
    lastReactionEmojiIndex: number,
    scheduleDatum: IScheduleData,
    scheduleSetup: IScheduleSetup
  ) {
    const emojis = ScheduleWriter.getCurrentDayEmoji(
      lastReactionEmojiIndex,
      dayAcronym
    );
    const scheduleOptions: IScheduleTextOptions = {
      days: dayAcronym,
      emojis,
      title: ScheduleWriter.getScheduleTitle(
        scheduleDatum.regionString,
        scheduleSetup
      ),
      times: scheduleDatum.times,
      timezoneName: scheduleDatum.timezoneShortName,
      coachCount: scheduleSetup.coachCount,
    };
    lastReactionEmojiIndex += dayAcronym.length;
    return ScheduleWriter.getScheduleText(scheduleOptions);
  }

  private static getScheduleTitle(
    region: string,
    scheduleSetup: IScheduleSetup
  ): string {
    return `**${region} ${scheduleSetup.type}**`;
  }

  private static getCurrentDayEmoji(
    lastReactionEmojiIndex: number,
    dayShortNames: string[]
  ): string[] {
    return scheduleReactionEmojis.slice(
      lastReactionEmojiIndex,
      lastReactionEmojiIndex + dayShortNames.length
    );
  }

  private static createDayAcronyms(
    scheduleSetup: IScheduleSetup
  ): Array<Array<string>> {
    return scheduleSetup.data.map((datum: IScheduleData) => {
      return datum.days.map((day: number) => {
        return CalendarDefinitions.weekDays[day].slice(0, 3);
      });
    });
  }

  private static reactWithScheduleEmojis(
    message: Message,
    lastEmojiIndex = -1
  ): void {
    for (let idx = 0; idx < ScheduleWriter.lastEmoji(lastEmojiIndex); idx++)
      message.react(scheduleReactionEmojis[idx]);
  }

  private static lastEmoji(lastEmojiIndex: number) {
    return lastEmojiIndex == -1
      ? scheduleReactionEmojis.length
      : lastEmojiIndex;
  }

  private static getWeekScheduleString(scheduleSetup: IScheduleSetup) {
    return `Schedule for Week #${ArbitraryTimeAlgos.getWeekNumber(
      scheduleSetup.mondayDate
    )} in ${scheduleSetup.mondayDate.getFullYear()} (${
      CalendarDefinitions.months[scheduleSetup.mondayDate.getMonth()]
    } ${scheduleSetup.mondayDate.getDate()} - ${
      CalendarDefinitions.months[scheduleSetup.sundayDate.getMonth()]
    } ${scheduleSetup.sundayDate.getDate()})`;
  }

  /**
   * Creates text for scheduling embedding. All arrays must be equal length
   * @param {Array<number>} days the days on which lobbies are scheduled
   * @param {Array<string>} emojis Which emoji is associated with which schedule
   * @param {string} title title of Schedule
   * @param {Array<string>} times time-strings in format hh:mm'am/pm'
   * @param {string} timezoneName
   * @param {number} coachCount Number of coaches required for schedule
   */
  private static getScheduleText(options: IScheduleTestOptions): IFieldElement {
    var schedule: IFieldElement = {
      name: options.title,
      value: "",
      inline: true,
    };

    for (let i = 0; i < options.days.length; i++)
      schedule.value +=
        "\n" +
        options.emojis[i] +
        " " +
        options.days[i] +
        " " +
        options.times[i] +
        " " +
        options.timezoneName +
        "\n coach 1: " +
        (options.coachCount > 1 ? "\n coach 2: " : "");

    return schedule;
  }
}
