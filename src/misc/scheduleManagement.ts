import {
  GuildChannel,
  GuildChannelManager,
  Message,
  MessageReaction,
  NewsChannel,
  TextChannel,
  User,
} from "discord.js";
import Pool from "mysql2/typings/mysql/lib/Pool";
import { DFZDiscordClient } from "./interfaces/DFZDiscordClient";
import { NextMondayAndSunday } from "./timeZone";

const aE = require("./answerEmbedding");
const c = require("./constants");
const cM = require("./channelManagement");
const dB = require("./database");
const Discord = require("discord.js");
const gM = require("./googleCalendarManagement");
const lM = require("./lobbyManagement");
const s = require("./types/schedule");
const tZ = require("./timeZone");
const rM = require("./roleManagement");
const scheduleReactionEmojis = [
  "1️⃣",
  "2️⃣",
  "3️⃣",
  "4️⃣",
  "5️⃣",
  "6️⃣",
  "7️⃣",
  "8️⃣",
  "9️⃣",
  "🔟",
];

const scheduleTypes = {
  lobby: "Lobbies",
  tryout: "Tryouts",
  botbash: "Botbash",
};

const lobbyPostTime = 60000 * 60 * 8; // at the moment 8 hours
const lobbyOverlapTime = 60000 * 60 * 3; // at the moment 3 hours

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

export interface DebugPool extends Pool {
  dfz_debugMode: boolean;
}

/**
 * Create header string for weekly schedule
 * @param {JSON} scheduleSetup
 */
function getWeekScheduleString(scheduleSetup: ScheduleSetup) {
  return (
    "Schedule for Week #" +
    tZ.getWeekNumber(scheduleSetup.mondayDate) +
    " in " +
    scheduleSetup.mondayDate.getFullYear() +
    " (" +
    tZ.months[scheduleSetup.mondayDate.getMonth() + 1] +
    " " +
    scheduleSetup.mondayDate.getDate() +
    " - " +
    tZ.months[scheduleSetup.sundayDate.getMonth() + 1] +
    " " +
    scheduleSetup.sundayDate.getDate() +
    ")"
  );
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
  days: Array<number>,
  emojis: Array<string>,
  title: string,
  times: Array<string>,
  timezoneName: string,
  coachCount: number
) {
  var schedule = {
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

  var dayShortNames: Array<Array<number>> = [];
  scheduleSetup.days.forEach((regionDays) => {
    var regionDaysShortNames: Array<number> = [];
    regionDays.forEach((day) => {
      regionDaysShortNames.push(tZ.weekDays[day].slice(0, 3));
    });
    dayShortNames.push(regionDaysShortNames);
  });

  var schedules = [];
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
        "**" + regionString + " " + scheduleSetup.type + "**",
        scheduleSetup.times[i],
        tz,
        scheduleSetup.coachCount
      )
    );

    emojiStartIndex += dayShortNames[i].length;
  }

  var footer =
    "If coaches are signed up, the corresponding lobby is automatically created roughly 8h prior to the event." +
    "\nIf coaches only sign up shortly before the lobby (4h or less), then they must manually create the lobby.";

  var _embed = aE.generateEmbedding(
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
async function findSchedule(
  dbHandle: Pool,
  messageId: string,
  emojiName: string
) {
  var schedules = await dB.getSchedules(dbHandle, messageId, emojiName);
  if (schedules.length === 0) return undefined;
  if (schedules.length > 1) {
    console.log("Schedules are not unique ??");
    return undefined;
  }

  return schedules[0];
}

function getLobbyType(schedule: Schedule) {
  if (schedule.type === scheduleTypes.tryout) {
    return c.lobbyTypes.tryout;
  }

  if (schedule.type === scheduleTypes.botbash) {
    return c.lobbyTypes.botbash;
  }

  if (schedule.coachCount === 2 && schedule.coaches.length > 1) {
    return c.lobbyTypes.inhouse;
  }

  return c.lobbyTypes.unranked;
}

/**
 * Creates a lobby post for due schedule
 * @param {GuildChannelManager} channels channels in which to post the lobby
 * @param {mysql.Pool} dbHandle bot database handle
 * @param {s.Schedule} schedule
 */
async function createScheduledLobby(
  channels: GuildChannelManager,
  dbHandle: Pool,
  schedule: Schedule
) {

  var lobbyRegionRole = rM.getRegionalRoleFromString(schedule.region);
  var timezoneName = rM.getRegionalRoleTimeZoneString(lobbyRegionRole);
  var zonedTime = tZ.getZonedTimeFromTimeZoneName(schedule.date, timezoneName);
  const { dayOfWeek} = zonedTime;

  var type = getLobbyType(schedule);
  var lobbyBeginnerRoles: Array<String> | undefined = undefined;
  var channel: GuildChannel | undefined = undefined;
  if (type === c.lobbyTypes.tryout) {
    channel = channels.cache.find(
      (chan) => chan.id === process.env.BOT_LOBBY_CHANNEL_TRYOUT
    );
    lobbyBeginnerRoles = [rM.tryoutRole];
  } else if (type === c.lobbyTypes.botbash) {
    channel = channels.cache.find(
      (chan) => chan.id === process.env.BOT_LOBBY_CHANNEL_BOTBASH
    );
    lobbyBeginnerRoles = rM.beginnerRoles.slice(0, 2);
  } else {
    var channelId = rM.getRegionalRoleLobbyChannel(lobbyRegionRole);
    channel = channels.cache.find((chan) => chan.id === channelId);
    lobbyBeginnerRoles = dayOfWeek === tZ.weekDayNumbers.Friday ? rM.beginnerRoles.slice(1, 4) : rM.beginnerRoles.slice(1, 3);
  }

  if (channel === undefined) {
    return;
  }
  

  await lM.postLobby(
    dbHandle,
    channel,
    schedule.coaches,
    type,
    lobbyBeginnerRoles,
    lobbyRegionRole,
    zonedTime
  );

  // message coaches
  schedule.coaches.forEach((c) => {
    if (channel === undefined) {
      return;
    }
    channel.guild.members
      .fetch(c)
      .then((guildMember) =>
        guildMember.send(
          "I just posted tonight's " +
            schedule.region +
            " lobby starting *" +
            tZ.getTimeString(zonedTime) +
            "*.\nYou are coaching 👍"
        )
      )
      .catch((err) =>
        console.log("error when messaging schedule coaches: " + err)
      );
  });
}

/**
 * Checks if in the scheduled lobby's channel is currently a posted lobby
 * @param {Pool} dbHandle
 * @param {Schedule} schedule
 */
async function isScheduleOverlapping(dbHandle: Pool, schedule: Schedule) {
  var lobbies = await dB.getLobbies(dbHandle);

  for (let i = 0; i < lobbies.length; i++) {
    var lobby = lobbies[i];
    if (schedule.type === scheduleTypes.tryout) {
      if (lobby.type == c.lobbyTypes.tryout)
        // all tryout games are in the same channel
        return true;
      continue;
    }

    // all normal games of the same region are in the same channel
    if (rM.getRegionalRoleFromString(schedule.region) === lobby.regionId)
      return true;
  }

  return false;
}

/**
 * Inserts all necessary lobbies, i.e. all lobbies due in the next x hours that havent been posted yet
 * @param {GuildChannelManager} channels
 * @param {Pool} dbHandle
 */
async function insertScheduledLobbies(
  channels: GuildChannelManager,
  dbHandle: Pool
) {
  var schedules = await dB.getSchedules(dbHandle);
  var now = Date.now();

  for (let i = 0; i < schedules.length; i++) {
    var s = schedules[i];

    if (s.coaches.length === 0)
      // only post lobbies for which we have coaches
      continue;

    if (s.lobbyPosted)
      // dont double post
      continue;

    var diff = s.date - now;
    if (diff < 0)
      // dont post lobbies that are in the past
      continue;

    if (diff > lobbyPostTime)
      // dont post lobbies that are too far in the future
      continue;

    // dont post lobbies that would overlap with another lobby
    // except for if the new lobby is urgent
    // var overlapping = await isScheduleOverlapping(dbHandle, s);
    // if(overlapping && diff > lobbyOverlapTime)
    //     return;

    s.lobbyPosted = true;
    await createScheduledLobby(channels, dbHandle, s);
    await dB.updateSchedule(dbHandle, s);
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
      await dB.updateSchedule(client.dbHandle, schedule);
      const guild = reaction.message.guild;
      if (guild === null) throw "Did not find guild in handleScheduleCoachAdd";
      await insertScheduledLobbies(guild.channels, client.dbHandle);
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
      await dB.updateSchedule(client.dbHandle, schedule);
      user.send("✅ Removed you as coach from the scheduled lobby.");
      resolve("Updated schedules");
    } catch (e) {
      reject("Failed updating schedule");
    }
  });
}

/**
 * verify input data sanity and create common schedule setup
 * @param {Date} _mondayDate
 * @param {Date} _sundayDate
 * @param {Array<Array<int>>} _days
 * @param {int} _type
 * @param {int} _coachCount
 * @param {Array<Array<string>>} _times
 */
function createScheduleSetup(
  _mondayDate: Date,
  _sundayDate: Date,
  _days: Array<Array<number>>,
  _type: string,
  _coachCount: number,
  _times: Array<Array<string>>
) {
  var numRegions = tZ.regions.length;

  // verify days
  if (_days.length === 1) {
    // same days for each region
    for (let i = 0; i < numRegions - 1; i++) _days.push(_days[0]); // duplicate for other regions
  } else if (_days.length !== numRegions) {
    // individual days for each region
    // has to be either of two
    return undefined;
  }

  // verify times
  if (_times.length === 1) {
    // same times for each region
    for (let i = 0; i < numRegions - 1; i++) _times.push(_times[0]); // duplicate for other regions
  } else if (_times.length !== numRegions) {
    // individual times for each region
    // has to be either of two
    return undefined;
  }

  // verify day-time-combination
  for (let i = 0; i < numRegions; i++) {
    if (_times[i].length !== _days[i].length) {
      return undefined;
    }
  }

  var scheduleSetup: ScheduleSetup = {
    mondayDate: _mondayDate,
    sundayDate: _sundayDate,
    days: _days,
    type: _type,
    coachCount: _coachCount,
    regionStrings: tZ.regionStrings,
    regions: tZ.regions,
    times: _times,
    timezoneShortNames: tZ.scheduleTimezoneNames_short,
    timezones: tZ.scheduleTimezoneNames,
  };

  return scheduleSetup;
}

function createLobbySchedules(
  dbHandle: Pool,
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
      var _date = tZ.getScheduledDate(
        scheduleSetup.mondayDate,
        day,
        time,
        timeZone
      );
      if (_date === undefined) {
        console.log("Could not determine scheduled date for " + scheduleSetup);
        return;
      }
      var reactionEmoji = scheduleReactionEmojis[dayBaseIndex + j];
      dB.insertSchedule(
        dbHandle,
        new s.Schedule(
          channelId,
          messageId,
          scheduleSetup.type,
          scheduleSetup.coachCount,
          reactionEmoji,
          _date,
          region
        )
      );
    }

    dayBaseIndex += days.length;
  }
}

async function createSchedules(
  dbHandle: Pool,
  channels: GuildChannelManager,
  chanId: string,
  coachCount: number,
  type: string,
  days: Array<Array<number>>,
  times: Array<Array<string>>,
  monAndSun: NextMondayAndSunday
) {
  var channel = channels.cache.find((chan) => {
    return chan.id == chanId;
  });
  if (channel !== undefined && channel.isText()) {
    var scheduleSetup = createScheduleSetup(
      monAndSun.monday,
      monAndSun.sunday,
      days,
      type,
      coachCount,
      times
    );

    if (scheduleSetup === undefined) {
      console.log(
        "ScheduleSetup creation returned 'undefined' in updateSchedules"
      );
      return;
    }
    var msg = await writeSchedule(channel, scheduleSetup);
    if (msg === undefined) {
      console.log("Writing schedule failed in updateSchedules");
      return;
    }

    createLobbySchedules(dbHandle, msg.id, channel.id, scheduleSetup);
  }
}

module.exports = {
  findSchedule: findSchedule,

  /**
   * Creates the data associated with the created lobby schedules
   * @param {Pool} dbHandle bot database handle
   * @param {string} messageId the message that is tied to the schedule
   * @param {string} channelId the channel that is tied to the schedule
   * @param {Schedule} scheduleSetup the setup that was used to create the schedule message
   */
  createLobbySchedules: createLobbySchedules,

  /**
   * update schedule: add additional schedules once on sunday and remove deprecated ones
   * @param {mysql.Pool} dbHandle bot database handle
   * @param {GuildChannelManager} channels guild channels
   */
  updateSchedules: async function (
    dbHandle: DebugPool,
    channels: GuildChannelManager
  ) {
    var now = new Date();
    var day = now.getDay();
    var saved_day = await dB.getDay(dbHandle);

    if (dbHandle.dfz_debugMode === true) {
      dbHandle.dfz_debugMode = false;
    } else {
      if (saved_day === day) return;

      if (isNaN(saved_day)) await dB.insertDay(dbHandle, day);
      else await dB.updateDay(dbHandle, day);

      if (day !== tZ.weekDayNumbers.Sunday) return;
    }

    // remove events from the past
    var schedules = await dB.getSchedules(dbHandle);
    var messageIDsToRemove = [];
    for (let i = 0; i < schedules.length; i++) {
      var schedule = schedules[i];
      if (
        messageIDsToRemove.find(
          (messageId) => messageId == schedule.messageId
        ) !== undefined
      )
        continue;

      var scheduleDate = new Date(schedules[i].date);
      if (scheduleDate < now) messageIDsToRemove.push(schedule.messageId);
    }
    dB.removeSchedules(dbHandle, messageIDsToRemove);

    // get dates to add (next week)
    var monAndSun: NextMondayAndSunday = tZ.getNextMondayAndSundayDate(/*new Date(now.setDate(now.getDate()+21))*/);

    // lobby schedule
    var coachCount5v5 = 2;
    var days5v5 = [[3, 5, 0]];
    var times5v5 = [
      ["8:00pm", "8:00pm", "4:00pm"],
      ["8:00pm", "8:00pm", "4:00pm"],
      ["9:00pm", "9:00pm", "4:00pm"],
    ];
    createSchedules(
      dbHandle,
      channels,
      cM.scheduleChannel5v5,
      coachCount5v5,
      scheduleTypes.lobby,
      days5v5,
      times5v5,
      monAndSun
    );

    // tryout schedule
    var coachCountTryout = 1;
    var daysTryout = [[2, 4, 6]];
    var timesTryout = [["8:00pm", "8:00pm", "8:00pm"]];
    createSchedules(
      dbHandle,
      channels,
      cM.scheduleChannelTryout,
      coachCountTryout,
      scheduleTypes.tryout,
      daysTryout,
      timesTryout,
      monAndSun
    );

    // botbash schedule
    var coachCountBotbash = 1;
    var daysBotbash = [[2, 4, 6]];
    var timesBotbash = [["8:45pm", "8:45pm", "8:45pm"]];
    createSchedules(
      dbHandle,
      channels,
      cM.scheduleChannelBotbash,
      coachCountBotbash,
      scheduleTypes.botbash,
      daysBotbash,
      timesBotbash,
      monAndSun
    );
  },

  /**
   * Update schedule to account for changes in coaches
   * @param {Schedule} schedule schedule that changed
   * @param {TextChannel} channel channel in which the schedule was posted
   */
  updateSchedulePost: async function (
    schedule: Schedule,
    channel: TextChannel
  ) {
    // fetch message
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
        lines[j + 1] =
          "coach 1: " +
          (schedule.coaches.length > 0 ? "<@" + schedule.coaches[0] + ">" : "");
        if (schedule.coachCount > 1)
          lines[j + 2] =
            "coach 2: " +
            (schedule.coaches.length > 1
              ? "<@" + schedule.coaches[1] + ">"
              : "");

        var new_embed = new Discord.MessageEmbed(old_embed);
        new_embed.fields[i].value = lines.join("\n");

        // update embed
        await message.edit(new_embed);
        return;
      }
    }
  },

  /**
   * Checks if user is coach in schedule, and if yes, removes them.
   * Then updates the schedules / google events to reflect this
   * @param {DFZDiscordClient} client discord client (fetching users for rewriting schedule google calendar event)
   * @param {MessageReaction} reaction determines which schedule we update
   * @param {User} user the guy who removed the reaction
   */
  removeCoachFromSchedule: async function (
    client: DFZDiscordClient,
    reaction: MessageReaction,
    user: User
  ) {
    var schedule = await findSchedule(
      client.dbHandle,
      reaction.message.id,
      reaction.emoji.name
    );

    var idx = schedule.coaches.findIndex((coach: string) => coach === user.id);
    if (idx === -1) return;

    // remove coach
    schedule.coaches.splice(idx, 1);

    // update google event
    gM.editCalendarEvent(schedule, client)
      .then(() => {
        // update schedule
        handleScheduleCoachWithdrawal(client, reaction, user, schedule);
      })
      .catch((err: any) => {
        // no type definition by google...
        // if we have no calendar or google api fails with 'Resource has been deleted' or 'not found' aka the event is already gone, then still remove coach from schedule
        if (
          err === gM.noCalendarRejection ||
          err.code === 410 ||
          err.code === 404
        ) {
          handleScheduleCoachWithdrawal(client, reaction, user, schedule);
        } else {
          console.log(err);
          user.send(
            "⛔ Could not remove you from the schedule. Maybe hit a rate-limit in GoogleCalendar. Try again in 5s."
          );
        }
      });
  },

  /**
   * Checks if user is coach in schedule, and if not, adds them.
   * Then updates the schedules / google events to reflect this
   * @param {DFZDiscordClient} client discord client (fetching users for rewriting schedule google calendar event)
   * @param {MessageReaction} reaction determines which schedule we update
   * @param {User} user the guy who removed the reaction
   */
  addCoach: async function (
    client: DFZDiscordClient,
    reaction: MessageReaction,
    user: User
  ) {
    const guildMember = await reaction.message.guild?.members.fetch(user.id);
    if (guildMember === undefined) {
      user.send("⛔ I could not find your ID in the DotaFromZero Discord.");
      console.log("addCoach: Did not find guild member");
    }

    // get role
    var role = rM.findRole(guildMember, rM.adminRoles);
    if (role === undefined || role === null) {
      user.send("⛔ You cannot interact because you are not a coach.");
      return;
    }

    var schedule = await findSchedule(
      client.dbHandle,
      reaction.message.id,
      reaction.emoji.name
    );

    if (schedule.coaches.find((coach: string) => coach === user.id)) {
      user.send("⛔ You are already coaching that lobby.");
      return;
    }

    schedule.coaches.push(user.id);

    var creationHandler = () => {
      if (schedule.eventId === undefined || schedule.eventId === "No Calendar")
        return gM.createCalendarEvent(schedule, client);
      else return gM.editCalendarEvent(schedule, client);
    };

    creationHandler()
      .then((eventId: string) => {
        schedule.eventId = eventId;
        return handleScheduleCoachAdd(client, reaction, user, schedule);
      })
      .catch((err: string) => {
        if (err === gM.noCalendarRejection)
          return handleScheduleCoachAdd(client, reaction, user, schedule);

        console.log(err);
        user.send(
          "⛔ Could not create an event in gcalendar for you. Maybe hit a rate-limit. Try again in 5s."
        );
      });
  },
  insertScheduledLobbies: insertScheduledLobbies,
};
