import {
  GuildChannel,
  GuildChannelManager,
  Message,
  MessageEmbed,
  MessageReaction,
  NewsChannel,
  TextChannel,
  User,
} from "discord.js";

import { DFZDiscordClient } from "../types/discord/DFZDiscordClient";
import { scheduleTypes, scheduleReactionEmojis } from "./types/scheduleTypes";
import {
  getCurrentMondayAndSundayDate,
  getScheduledDate,
  getTimeString,
  getWeekNumber,
  getZonedTimeFromTimeZoneName,
  months,
  NextMondayAndSunday,
  regions,
  regionStrings,
  scheduleTimezoneNames,
  scheduleTimezoneNames_short,
  Time,
  weekDays,
} from "./timeZone";
import { IFieldElement } from "../types/discord/interfaces/FieldElement";
import { guildId, lobbyTypes } from "./constants";
import { ChannelManager } from "../types/discord/ChannelManager";
import { GoogleCalendarManager } from "../types/gcalendar/GoogleCalendarManager";
import { postLobby, PostLobbyOptions } from "./lobbyManagement";
import {
  getRegionalRoleFromString,
  tryoutRole,
  beginnerRoles,
  getRegionalRoleLobbyChannel,
  getRegionalRoleTimeZoneString,
  findRole,
  adminRoles,
} from "./roleManagement";
import { Schedule } from "../types/serializables/schedule";
import { ScheduleSerializer } from "../types/serializers/scheduleSerializer";
import { DFZDataBaseClient } from "../types/database/DFZDataBaseClient";
import { EmbeddingCreator } from "../types/discord/EmbeddingCreator";

const lobbyPostTime = 60000 * 60 * 5; // at the moment 5 hours
const aDay = 1000 * 60 * 60 * 24;

interface ScheduleSetup {
  mondayDate: Date;
  sundayDate: Date;
  days: Array<Array<number>>;
  type: string;
  coachCount: number;
  regionStrings: Array<string>;
  regions: Array<string>;
  times: Array<Array<string>>;
  timezoneShortNames: Array<string>;
  timezones: Array<string>;
}

/**
 * Create header string for weekly schedule
 * @param {ScheduleSetup} scheduleSetup
 */
function getWeekScheduleString(scheduleSetup: ScheduleSetup) {
  return `Schedule for Week #${getWeekNumber(
    scheduleSetup.mondayDate
  )} in ${scheduleSetup.mondayDate.getFullYear()} (${
    months[scheduleSetup.mondayDate.getMonth()]
  } ${scheduleSetup.mondayDate.getDate()} - ${
    months[scheduleSetup.sundayDate.getMonth()]
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
function getScheduleText(
  days: Array<string>,
  emojis: Array<string>,
  title: string,
  times: Array<string>,
  timezoneName: string,
  coachCount: number
) {
  var schedule: IFieldElement = {
    name: title,
    value: "",
    inline: true,
  };

  for (let i = 0; i < days.length; i++)
    schedule.value +=
      "\n" +
      emojis[i] +
      " " +
      days[i] +
      " " +
      times[i] +
      " " +
      timezoneName +
      "\n coach 1: " +
      (coachCount > 1 ? "\n coach 2: " : "");

  return schedule;
}

function reactWithScheduleEmojis(message: Message, lastEmojiIndex = -1) {
  for (
    let idx = 0;
    idx <
    (lastEmojiIndex == -1 ? scheduleReactionEmojis.length : lastEmojiIndex);
    idx++
  )
    message.react(scheduleReactionEmojis[idx]);
}

/**
 * creates schedule message according to schedule setup
 * @param {Textchannel} channel schedule channel
 * @param {ScheduleSetup} scheduleSetup json containing all information regarding schedule
 */
async function writeSchedule(
  channel: TextChannel | NewsChannel,
  scheduleSetup: ScheduleSetup
) {
  if (
    scheduleSetup.regions.length !== scheduleSetup.timezones.length ||
    scheduleSetup.regions.length !== scheduleSetup.times.length
  )
    return undefined;

  var dayShortNames: Array<Array<string>> = [];
  scheduleSetup.days.forEach((regionDays) => {
    var regionDaysShortNames: Array<string> = [];
    regionDays.forEach((day) => {
      regionDaysShortNames.push(weekDays[day].slice(0, 3));
    });
    dayShortNames.push(regionDaysShortNames);
  });

  var schedules: Array<IFieldElement> = [];
  var emojiStartIndex = 0;
  for (let i = 0; i < scheduleSetup.regions.length; i++) {
    var regionString = scheduleSetup.regionStrings[i];
    var tz = scheduleSetup.timezoneShortNames[i];

    var emojis = scheduleReactionEmojis.slice(
      emojiStartIndex,
      emojiStartIndex + dayShortNames[i].length
    );
    schedules.push(
      getScheduleText(
        dayShortNames[i],
        emojis,
        `**${regionString} ${scheduleSetup.type}**`,
        scheduleSetup.times[i],
        tz,
        scheduleSetup.coachCount
      )
    );

    emojiStartIndex += dayShortNames[i].length;
  }

  var footer = `If coaches are signed up, the corresponding lobby is automatically created roughly 8h prior to the event.\nIf coaches only sign up shortly before the lobby (4h or less), then they must manually create the lobby.`;

  var _embed = EmbeddingCreator.create(
    getWeekScheduleString(scheduleSetup),
    "Sign up as a coach by reacting to the respective number.",
    footer,
    schedules
  );
  var message = await channel.send({ embed: _embed });
  reactWithScheduleEmojis(message, emojiStartIndex);

  return message;
}

/**
 * Finds unique schedule identified by message ID and emoji
 * @param {Pool} dbHandle
 * @param {string} messageId
 * @param {string} emojiName
 */
export async function findSchedule(
  dbClient: DFZDataBaseClient,
  messageId: string,
  emojiName: string
) {
  const serializer = new ScheduleSerializer(dbClient, messageId, emojiName);
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
  channel: GuildChannel,
  zonedTime: Time
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
  const channel = channelManager.cache.find((chan) => chan.id === channelId);

  if (
    channel === undefined ||
    !channel.isText() ||
    beginnerRoles === undefined
  ) {
    return;
  }

  const timezoneName = getRegionalRoleTimeZoneString(regionRole),
    zonedTime = getZonedTimeFromTimeZoneName(
      Number(schedule.date),
      timezoneName
    );

  if (zonedTime === undefined || regionRole === undefined) return;

  var options: PostLobbyOptions = {
    type: type,
    regionRole: regionRole,
    userRoles: beginnerRoles,
    time: zonedTime,
    coaches: schedule.coaches,
    optionalText: "",
  };

  await postLobby(dbClient, channel, options);

  informCoachesOfSchedulePost(schedule, channel, zonedTime);
}

/**
 * Inserts all necessary lobbies, i.e. all lobbies due in the next x hours that havent been posted yet
 */
export async function insertScheduledLobbies(
  channels: GuildChannelManager,
  dbClient: DFZDataBaseClient
) {
  const serializer = new ScheduleSerializer(dbClient);
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
 * handles how schedules and calendar events react to addition of a coach
 * @param {DFZDiscordClient} client
 * @param {MessageReaction} reaction
 * @param {User} user
 * @param {Schedule} schedule
 */
async function handleScheduleCoachAdd(
  client: DFZDiscordClient,
  reaction: MessageReaction,
  user: User,
  schedule: Schedule
) {
  return new Promise(async function (resolve, reject) {
    try {
      const serializer = new ScheduleSerializer(client.dbClient);
      await serializer.update(schedule);

      const guild = reaction.message.guild;
      if (guild === null) throw "Did not find guild in handleScheduleCoachAdd";
      await insertScheduledLobbies(guild.channels, client.dbClient);
      await module.exports.updateSchedulePost(
        schedule,
        reaction.message.channel
      );
      user.send("✅ Added you as a coach to the scheduled lobby.");
      resolve("Updated schedules");
    } catch (e) {
      reject("Failed updating schedule");
    }
  });
}

/**
 * handles how schedules and calendar events react to coach withdrawal
 * @param {DFZDiscordClient} client
 * @param {MessageReaction} reaction
 * @param {User} user
 * @param {Schedule} schedule
 */
async function handleScheduleCoachWithdrawal(
  client: DFZDiscordClient,
  reaction: MessageReaction,
  user: User,
  schedule: Schedule
) {
  return new Promise(async function (resolve, reject) {
    try {
      schedule.eventId = undefined;
      await module.exports.updateSchedulePost(
        schedule,
        reaction.message.channel
      );
      const serializer = new ScheduleSerializer(client.dbClient);
      await serializer.update(schedule);
      user.send("✅ Removed you as coach from the scheduled lobby.");
      resolve("Updated schedules");
    } catch (e) {
      reject("Failed updating schedule");
    }
  });
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
): ScheduleSetup | undefined {
  var numRegions = regions.length;

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

  return {
    mondayDate: mondayDate,
    sundayDate: sundayDate,
    days: days,
    type: type,
    coachCount: coachCount,
    regionStrings: regionStrings,
    regions: regions,
    times: times,
    timezoneShortNames: scheduleTimezoneNames_short,
    timezones: scheduleTimezoneNames,
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
  messageId: string,
  channelId: string,
  scheduleSetup: ScheduleSetup
) {
  var dayBaseIndex = 0;
  for (let i = 0; i < scheduleSetup.regions.length; i++) {
    var region = scheduleSetup.regions[i];
    var timeZone = scheduleSetup.timezones[i];
    var days = scheduleSetup.days[i];
    var times = scheduleSetup.times[i];

    for (let j = 0; j < days.length; j++) {
      var day = days[j];
      var time = times[j];
      var date = getScheduledDate(
        scheduleSetup.mondayDate,
        day,
        time,
        timeZone
      );
      if (date === undefined) {
        console.log("Could not determine scheduled date for " + scheduleSetup);
        return;
      }
      var reactionEmoji = scheduleReactionEmojis[dayBaseIndex + j];

      const serializer = new ScheduleSerializer(dbClient);
      serializer.insert(
        new Schedule(
          channelId,
          messageId,
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
  scheduleData: WeeklyScheduleData,
  monAndSun: NextMondayAndSunday
) {
  var channel = channels.cache.find((chan) => {
    return chan.id == scheduleData.channelId;
  });
  if (channel === undefined || !channel.isText()) return;

  var scheduleSetup = createScheduleSetup(
    monAndSun.monday,
    monAndSun.sunday,
    scheduleData.daysByRegion,
    scheduleData.type,
    scheduleData.coachCount,
    scheduleData.timesByRegion
  );
  if (!scheduleSetup) return;

  var message = await writeSchedule(channel, scheduleSetup);
  if (message === undefined) return;

  createSchedulesInDatabase(dbClient, message.id, channel.id, scheduleSetup);
}

interface WeeklyScheduleData {
  coachCount: number;
  daysByRegion: Array<Array<number>>;
  timesByRegion: Array<Array<string>>;
  channelId: string;
  type: string;
}

const t1_t2_Data: WeeklyScheduleData = {
  coachCount: 2,
  daysByRegion: [[3, 5, 0]],
  timesByRegion: [
    ["8:00pm", "8:00pm", "4:00pm"],
    ["8:00pm", "8:00pm", "4:00pm"],
    ["9:00pm", "9:00pm", "4:00pm"],
  ],
  channelId: ChannelManager.scheduleChannel5v5,
  type: scheduleTypes.lobbyt1,
};

const t3_t4_Data: WeeklyScheduleData = {
  coachCount: 2,
  daysByRegion: [[2, 5, 0]],
  timesByRegion: [
    ["8:00pm", "8:00pm", "4:00pm"],
    ["8:00pm", "8:00pm", "4:00pm"],
    ["9:00pm", "9:00pm", "4:00pm"],
  ],
  channelId: ChannelManager.scheduleChannel5v5_t3,
  type: scheduleTypes.lobbyt3,
};

const tryoutData: WeeklyScheduleData = {
  coachCount: 1,
  daysByRegion: [[2, 4, 6]],
  timesByRegion: [["8:00pm", "8:00pm", "8:00pm"]],
  channelId: ChannelManager.scheduleChannelTryout,
  type: scheduleTypes.tryout,
};

const botbashData: WeeklyScheduleData = {
  coachCount: 1,
  daysByRegion: [[2, 4, 6]],
  timesByRegion: [["8:45pm", "8:45pm", "8:45pm"]],
  channelId: ChannelManager.scheduleChannelBotbash,
  type: scheduleTypes.botbash,
};

const weeklyScheduleDatas = [botbashData, tryoutData, t3_t4_Data, t1_t2_Data];

export async function postSchedules(client: DFZDiscordClient) {
  if (!(await weeklyScheduleShouldBePosted(client)))
    return "I already posted this week's schedules";

  const guild = await client.guilds.fetch(guildId);
  addCurrentWeekSchedule(guild.channels, client.dbClient);
}

async function weeklyScheduleShouldBePosted(client: DFZDiscordClient) {
  const schedules = await getAllSchedules(client.dbClient);
  const { monday } = getCurrentMondayAndSundayDate();
  return !existsScheduleAfterMonday(schedules, monday);
}

async function getAllSchedules(dbClient: DFZDataBaseClient) {
  const serializer = new ScheduleSerializer(dbClient);
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
  var mondayAndSunday: NextMondayAndSunday = getCurrentMondayAndSundayDate();
  for (const data of weeklyScheduleDatas)
    createSchedules(dbClient, channels, data, mondayAndSunday);
}

export async function tryRemoveDeprecatedSchedules(
  dbClient: DFZDataBaseClient
) {
  try {
    var yesterday = new Date(Date.now() - aDay);
    await removeDeprecatedSchedules(yesterday, dbClient);
  } catch (e) {
    console.log(`Error in tryRemoveDeprecatedSchedules\nReason:\n${e}`);
  }
}

async function removeDeprecatedSchedules(
  deprecationDate: Date,
  dbClient: DFZDataBaseClient
) {
  const serializer = new ScheduleSerializer(dbClient);
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
        await message.edit(new_embed);
        return;
      }
    }
  } catch (e) {
    console.log(`Error in UpdateSchedulePost: ${e}`);
  }
}

/**
 * Checks if user is coach in schedule, and if yes, removes them.
 * Then updates the schedules / google events to reflect this
 * @param {DFZDiscordClient} client discord client (fetching users for rewriting schedule google calendar event)
 * @param {MessageReaction} reaction determines which schedule we update
 * @param {User} user the guy who removed the reaction
 */
export async function removeCoachFromSchedule(
  client: DFZDiscordClient,
  reaction: MessageReaction,
  user: User
) {
  var schedule = await findSchedule(
    client.dbClient,
    reaction.message.id,
    reaction.emoji.name
  );
  if (schedule === undefined) return;

  var idx = schedule.coaches.findIndex((coach: string) => coach === user.id);
  if (idx === -1) return;

  // remove coach
  schedule.coaches.splice(idx, 1);

  // update google event
  try {
    await GoogleCalendarManager.editCalendarEvent(schedule, client);
  } catch (err) {
    console.log(err);
  }

  await handleScheduleCoachWithdrawal(client, reaction, user, schedule);
}

/**
 * Checks if user is coach in schedule, and if not, adds them.
 * Then updates the schedules / google events to reflect this
 * @param {DFZDiscordClient} client discord client (fetching users for rewriting schedule google calendar event)
 * @param {MessageReaction} reaction determines which schedule we update
 * @param {User} user the guy who removed the reaction
 */
export async function addCoachToSchedule(
  client: DFZDiscordClient,
  reaction: MessageReaction,
  user: User
) {
  const guildMember = await reaction.message.guild?.members.fetch(user.id);
  if (guildMember === undefined) {
    user.send("⛔ I could not find your ID in the DotaFromZero Discord.");
    return;
  }

  var role = findRole(guildMember, adminRoles);
  if (role === undefined || role === null) {
    user.send("⛔ You cannot interact because you are not a coach.");
    return;
  }

  var schedule = await findSchedule(
    client.dbClient,
    reaction.message.id,
    reaction.emoji.name
  );
  if (schedule === undefined) return;

  if (schedule.coaches.find((coach: string) => coach === user.id)) {
    user.send("⛔ You are already coaching that lobby.");
    return;
  }

  schedule.coaches.push(user.id);

  await updateOrCreateGoogleEvent(client, schedule);
  await handleScheduleCoachAdd(client, reaction, user, schedule);
}

async function updateOrCreateGoogleEvent(
  client: DFZDiscordClient,
  schedule: Schedule
) {
  try {
    await tryUpdateOrCreateGoogleEvent(client, schedule);
  } catch (err) {
    console.log(err);
  }
}

async function tryUpdateOrCreateGoogleEvent(
  client: DFZDiscordClient,
  schedule: Schedule
) {
  if (schedule.eventId === undefined || schedule.eventId === "No Calendar")
    schedule.eventId = await GoogleCalendarManager.createCalendarEvent(
      schedule,
      client
    );
  else
    schedule.eventId = await GoogleCalendarManager.editCalendarEvent(
      schedule,
      client
    );
}
