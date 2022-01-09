import {
  GuildChannelManager,
  Message,
  MessageEmbed,
  MessageReaction,
  NewsChannel,
  PartialMessage,
  TextChannel,
  User,
} from "discord.js";
import { lobbyTypes } from "../../misc/constants";
import { IGuildClient } from "../../misc/types/IGuildClient";
import { IMessageIdentifier } from "../../misc/types/IMessageIdentifier";
import {
  scheduleReactionEmojis,
  scheduleTypes,
} from "../../misc/types/scheduleTypes";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { DFZDiscordClient } from "../discord/DFZDiscordClient";
import { IFieldElement } from "../discord/interfaces/IFieldElement";
import {
  adminRoles,
  beginnerRoles,
  findRole,
  getRegionalRoleFromString,
  getRegionalRoleLobbyChannel,
  getRegionalRoleTimeZoneString,
  tryoutRole,
} from "../discord/roleManagement";
import { GoogleCalendarManager } from "../gcalendar/GoogleCalendarManager";
import { PostLobbyOptions } from "../lobby/interfaces/PostLobbyOptions";
import { LobbyPostManipulator } from "../lobby/LobbyPostManipulator";
import { Schedule } from "../serializables/schedule";
import { ScheduleSerializer } from "../serializers/ScheduleSerializer";
import { SerializeUtils } from "../serializers/SerializeUtils";
import { IGuildDataBaseClient } from "../serializers/types/IGuildDataBaseClient";
import { ArbitraryTimeAlgos } from "../time/ArbitraryTimeAlgos";
import { ITime } from "../time/interfaces/Time";
import { RegionDefinitions } from "../time/RegionDefinitions";
import { TimeConverter } from "../time/TimeConverter";
import {
  getScheduledDate,
  getTimeString,
  getZonedTimeFromTimeZoneName,
  NextMondayAndSunday,
  scheduleTimezoneNames_short,
} from "../time/timeZone";
import { ScheduleWriter } from "./ScheduleWriter";
import { IScheduleData, IScheduleSetup } from "./types/IScheduleSetup";
import { IWeeklyScheduleData } from "./types/IWeeklyScheduleData";
import { weeklyScheduleDatas } from "./WeeklyScheduleDatas";

const lobbyPostTime = TimeConverter.hToMs * 5; // at the moment 5 hours

/**
 * Finds unique schedule identified by message ID and emoji
 * @param {Pool} dbHandle
 * @param {string} messageId
 * @param {string} emojiName
 */
export async function findSchedule(
  dbClient: DFZDataBaseClient,
  message: Message | PartialMessage,
  emojiName: string | null
) {
  const gdbc = SerializeUtils.fromMessagetoGuildDBClient(message, dbClient);
  const serializer = new ScheduleSerializer(
    gdbc,
    message.id,
    emojiName ? emojiName : ""
  );
  const schedules = await serializer.get();
  if (schedules.length === 0) return undefined;
  if (schedules.length > 1) {
    console.log("Schedules are not unique ??");
    return undefined;
  }

  return schedules[0];
}

function getLobbyType(schedule: Schedule) {
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

function getScheduledLobbyChannelId(
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

function getScheduleLobbyBeginnerRoles(
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

function informCoachesOfSchedulePost(
  schedule: Schedule,
  channel: TextChannel | NewsChannel,
  zonedTime: ITime
) {
  schedule.coaches.forEach((coach) => {
    channel.guild.members
      .fetch(coach)
      .then((guildMember) =>
        guildMember.send(
          `I just posted tonight's ${
            schedule.region
          } lobby starting *${getTimeString(zonedTime)}*.\nYou are coaching 👍`
        )
      )
      .catch((err) =>
        console.log("error when messaging schedule coaches: " + err)
      );
  });
}

/**
 * Creates a lobby post for due schedule
 * @param {GuildChannelManager} channels channels in which to post the lobby
 * @param {mysql.Pool} dbHandle bot database handle
 * @param {s.Schedule} schedule
 */
async function createScheduledLobby(
  channelManager: GuildChannelManager,
  dbClient: DFZDataBaseClient,
  schedule: Schedule
) {
  const regionRole = getRegionalRoleFromString(schedule.region);
  const type = getLobbyType(schedule);
  const beginnerRoles = getScheduleLobbyBeginnerRoles(type, schedule.type);
  const channelId = getScheduledLobbyChannelId(type, schedule.type, regionRole);
  const channel = await channelManager.fetch(channelId ? channelId : "");

  if (!channel || !channel.isText()) {
    return;
  }

  const timezoneName = getRegionalRoleTimeZoneString(regionRole),
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
  };

  await LobbyPostManipulator.postLobby_deprecated(dbClient, channel, options);

  informCoachesOfSchedulePost(schedule, channel, zonedTime);
}

/**
 * Inserts all necessary lobbies, i.e. all lobbies due in the next x hours that havent been posted yet
 */
export async function insertScheduledLobbies(
  channels: GuildChannelManager,
  dbClient: DFZDataBaseClient
) {
  const gdbc = SerializeUtils.fromGuildtoGuildDBClient(
    channels.guild,
    dbClient
  );
  const serializer = new ScheduleSerializer(gdbc);
  const schedules = await serializer.get();
  var now = Date.now();

  for (let i = 0; i < schedules.length; i++) {
    var s = schedules[i];

    if (s.coaches.length === 0)
      // only post lobbies for which we have coaches
      continue;

    if (s.lobbyPosted)
      // dont double post
      continue;

    var diff = Number(s.date) - now;
    if (diff < 0)
      // dont post lobbies that are in the past
      continue;

    if (diff > lobbyPostTime)
      // dont post lobbies that are too far in the future
      continue;

    s.lobbyPosted = true;
    await createScheduledLobby(channels, dbClient, s);
    await serializer.update(s);
  }
}

/**
 * verify input data sanity and create common schedule setup
 * @param {Date} mondayDate
 * @param {Date} sundayDate
 * @param {Array<Array<int>>} days
 * @param {int} type
 * @param {int} coachCount
 * @param {Array<Array<string>>} times
 */
function createScheduleSetup(
  mondayDate: Date,
  sundayDate: Date,
  days: Array<Array<number>>,
  type: string,
  coachCount: number,
  times: Array<Array<string>>
): IScheduleSetup | undefined {
  var numRegions = RegionDefinitions.regions.length;

  // verify days
  if (days.length === 1) {
    // same days for each region
    for (let i = 0; i < numRegions - 1; i++) days.push(days[0]); // duplicate for other regions
  } else if (days.length !== numRegions) {
    // individual days for each region
    // has to be either of two
    return undefined;
  }

  // verify times
  if (times.length === 1) {
    // same times for each region
    for (let i = 0; i < numRegions - 1; i++) times.push(times[0]); // duplicate for other regions
  } else if (times.length !== numRegions) {
    // individual times for each region
    // has to be either of two
    return undefined;
  }

  // verify day-time-combination
  for (let i = 0; i < numRegions; i++) {
    if (times[i].length !== days[i].length) {
      return undefined;
    }
  }

  const regions = RegionDefinitions.regions.map((region) => region.name);
  const regionStrings = RegionDefinitions.regions.map(
    (region) => region.fancyVersion
  );
  const timezones = RegionDefinitions.regions.map(
    (region) => region.timeZoneName
  );
  const scheduleDatas: IScheduleData[] = [];
  for (let i = 0; i < numRegions; i++) {
    scheduleDatas.push({
      days: days[i],
      region: regions[i],
      regionString: regionStrings[i],
      times: times[i],
      timezone: timezones[i],
      timezoneShortName: scheduleTimezoneNames_short[i],
    });
  }

  return {
    mondayDate: mondayDate,
    sundayDate: sundayDate,
    data: scheduleDatas,
    type: type,
    coachCount: coachCount,
  };
}

/**
 * Creates the data associated with the created lobby schedules
 * @param {Pool} dbHandle bot database handle
 * @param {string} messageId the message that is tied to the schedule
 * @param {string} channelId the channel that is tied to the schedule
 * @param {Schedule} scheduleSetup the setup that was used to create the schedule message
 */
export function createSchedulesInDatabase(
  dbClient: DFZDataBaseClient,
  messageIdentifier: IMessageIdentifier,
  scheduleSetup: IScheduleSetup
) {
  const serializer = new ScheduleSerializer(
    SerializeUtils.getGuildDBClient(messageIdentifier.guildId, dbClient)
  );

  var dayBaseIndex = 0;
  for (let i = 0; i < scheduleSetup.data.length; i++) {
    const datum = scheduleSetup.data[i];
    const region = datum.region;
    const timeZone = datum.timezone;
    const days = datum.days;
    const times = datum.times;

    for (let j = 0; j < days.length; j++) {
      const day = days[j];
      const time = times[j];
      const date = getScheduledDate(
        scheduleSetup.mondayDate,
        day,
        time,
        timeZone
      );
      if (date === undefined) {
        console.log("Could not determine scheduled date for " + scheduleSetup);
        return;
      }
      const reactionEmoji = scheduleReactionEmojis[dayBaseIndex + j];

      serializer.insert(
        new Schedule(
          messageIdentifier.guildId,
          messageIdentifier.channelId,
          messageIdentifier.messageId,
          scheduleSetup.type,
          scheduleSetup.coachCount,
          reactionEmoji,
          date?.toString(),
          region
        )
      );
    }

    dayBaseIndex += days.length;
  }
}

async function createSchedules(
  dbClient: DFZDataBaseClient,
  channels: GuildChannelManager,
  scheduleData: IWeeklyScheduleData,
  monAndSun: NextMondayAndSunday
) {
  const channel = await channels.fetch(scheduleData.channelId);
  if (channel === null || !channel?.isText()) return;
  var scheduleSetup = createScheduleSetup(
    monAndSun.monday,
    monAndSun.sunday,
    scheduleData.daysByRegion,
    scheduleData.type,
    scheduleData.coachCount,
    scheduleData.timesByRegion
  );
  if (!scheduleSetup) return;

  var message = await ScheduleWriter.write(channel, scheduleSetup);
  if (message === undefined) return;

  const guildId = channels.guild.id;
  const scheduleIdentifier: IMessageIdentifier = {
    channelId: channel.id,
    messageId: message.id,
    guildId,
  };

  createSchedulesInDatabase(dbClient, scheduleIdentifier, scheduleSetup);
}

export async function postSchedules(client: IGuildClient) {
  if (!(await weeklyScheduleShouldBePosted(client))) return;
  addCurrentWeekSchedule(client.guild.channels, client.client.dbClient);
}

async function weeklyScheduleShouldBePosted(guildClient: IGuildClient) {
  const schedules = await getAllSchedules(guildClient);
  const { monday } = ArbitraryTimeAlgos.getCurrentMondayAndSundayDate();
  return !existsScheduleAfterMonday(schedules, monday);
}

async function getAllSchedules(guildClient: IGuildClient) {
  const gdbc = SerializeUtils.fromGuildtoGuildDBClient(
    guildClient.guild,
    guildClient.client.dbClient
  );
  const serializer = new ScheduleSerializer(gdbc);
  return await serializer.get();
}

function existsScheduleAfterMonday(schedules: Schedule[], monday: Date) {
  const scheduleAfterMonday = schedules.find(
    (schedule) => monday < new Date(Number(schedule.date))
  );

  return scheduleAfterMonday !== undefined;
}

export function addCurrentWeekSchedule(
  channels: GuildChannelManager,
  dbClient: DFZDataBaseClient
) {
  var mondayAndSunday: NextMondayAndSunday =
    ArbitraryTimeAlgos.getCurrentMondayAndSundayDate();
  for (const data of weeklyScheduleDatas)
    createSchedules(dbClient, channels, data, mondayAndSunday);
}

export async function tryRemoveDeprecatedSchedules(
  dbClient: DFZDataBaseClient
) {
  try {
    var yesterday = new Date(Date.now() - TimeConverter.dayToMs);
    await removeDeprecatedSchedules(yesterday, dbClient);
  } catch (e) {
    console.log(`Error in tryRemoveDeprecatedSchedules\nReason:\n${e}`);
  }
}

async function removeDeprecatedSchedules(
  deprecationDate: Date,
  dbClient: DFZDataBaseClient
) {
  const gdbc: IGuildDataBaseClient = { dbClient, guildId: "" }; // guild id empty, remove all deprecated schedules.
  const serializer = new ScheduleSerializer(gdbc);
  var schedules = await serializer.get();

  var schedulesToRemove: Array<Schedule> = [];
  for (let i = 0; i < schedules.length; i++) {
    var scheduleDate = new Date(parseInt(schedules[i].date));
    if (scheduleDate < deprecationDate) schedulesToRemove.push(schedules[i]);
  }

  if (schedulesToRemove.length === 0) return;

  serializer.delete(schedulesToRemove);
}

/**
 * Update schedule to account for changes in coaches
 * @param {Schedule} schedule schedule that changed
 * @param {TextChannel} channel channel in which the schedule was posted
 */
export async function updateSchedulePost(
  schedule: Schedule,
  channel: TextChannel
) {
  try {
    const message = await channel.messages.fetch(schedule.messageId);
    if (message === undefined || message === null) return;

    // generate new embed
    var old_embed = message.embeds[0];
    for (let i = 0; i < old_embed.fields.length; i++) {
      var field = old_embed.fields[i];
      if (field.value.indexOf(schedule.emoji) === -1) continue;

      var lines = field.value.split("\n");
      for (let j = 0; j < lines.length; j++) {
        var line = lines[j];
        if (
          line.indexOf(schedule.emoji) === -1 ||
          j + schedule.coachCount >= lines.length
        )
          continue;

        // coach change
        lines[j + 1] = `coach 1: ${
          schedule.coaches.length > 0 ? "<@" + schedule.coaches[0] + ">" : ""
        }`;
        if (schedule.coachCount > 1)
          lines[j + 2] = `coach 2: ${
            schedule.coaches.length > 1 ? "<@" + schedule.coaches[1] + ">" : ""
          }`;

        var new_embed = new MessageEmbed(old_embed);
        new_embed.fields[i].value = lines.join("\n");

        // update embed
        await message.edit({ embeds: [new_embed] });
        return;
      }
    }
  } catch (e) {
    console.log(`Error in UpdateSchedulePost: ${e}`);
  }
}
