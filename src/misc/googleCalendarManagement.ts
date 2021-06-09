import { Client } from "discord.js";
import { Auth, calendar_v3, google } from "googleapis";
import { Schedule } from "../types/serializables/schedule";
import { getLobbyNameByType, lobbyTypes } from "./constants";
import { regions, getTimeZoneStringFromRegion } from "./timeZone";
import { scheduleTypes } from "./types/scheduleTypes";

const calendarURI = ["https://www.googleapis.com/auth/calendar"];

let calendarAvailable = true;
// configure google auth client
let jwtClient: Auth.JWT | undefined = undefined;
let calendar: calendar_v3.Calendar | undefined = undefined;
try {
  const privateKey = require("../../../service_key.json");

  jwtClient = new Auth.JWT(
    privateKey.client_email,
    undefined,
    privateKey.private_key,
    calendarURI
  );

  if (jwtClient === undefined) {
    throw "Could not auth with GoogleApi";
  }

  jwtClient.authorize().then(() => {
    console.log("Successfully connected to Google API!");
    if (jwtClient !== undefined) calendar = google.calendar({ version: "v3" });
  });
} catch (e) {
  console.log(e);
  calendarAvailable = false;
}

function getCalendarIDByRegion(region: string) {
  if (region === regions[0]) return process.env.CALENDAR_REGION_EU;
  else if (region === regions[1]) return process.env.CALENDAR_REGION_NA;
  else if (region === regions[2]) return process.env.CALENDAR_REGION_SEA;

  return undefined;
}

function createEventSummary(schedule: Schedule): string {
  var lobbyTypeName = "";
  switch (schedule.type) {
    case scheduleTypes.tryout:
      lobbyTypeName = getLobbyNameByType(lobbyTypes.tryout);
      break;
    case scheduleTypes.botbash:
      lobbyTypeName = getLobbyNameByType(lobbyTypes.botbash);
      break;
    case scheduleTypes.lobbyt1:
      lobbyTypeName = `${getLobbyNameByType(
        schedule.coaches.length == 1 ? lobbyTypes.unranked : lobbyTypes.inhouse
      )} T1/T2`;
      break;
    case scheduleTypes.lobbyt3:
      lobbyTypeName = `${getLobbyNameByType(
        schedule.coaches.length == 1 ? lobbyTypes.unranked : lobbyTypes.inhouse
      )} T3/T4`;
      break;
  }

  return `${schedule.region} ${lobbyTypeName} lobby`;
}

async function createEventDescription(schedule: Schedule, client: Client) {
  return new Promise<string>(async function (resolve, reject) {
    try {
      var coach1 = await client.users.fetch(schedule.coaches[0]);
      var coachesString = coach1.username;
      if (schedule.coaches.length > 1) {
        var coach2 = await client.users.fetch(schedule.coaches[1]);
        coachesString += " and " + coach2.username;
      }
      resolve("Coached by " + coachesString);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * insert event in google calendar api
 * @param {calendar_v3.Resource$Events} event scheduled event in google api format
 * @param {string} cal_ID calender ID
 * @param {s.Schedule} schedule dfz-schedule
 */
function insertEvent(event: calendar_v3.Schema$Event, schedule: Schedule) {
  return new Promise<string | null | undefined>(async function (
    resolve,
    reject
  ) {
    const params: calendar_v3.Params$Resource$Events$Insert = {
      auth: jwtClient,
      calendarId: getCalendarIDByRegion(schedule.region),
      requestBody: event,
    };

    try {
      const res = await calendar?.events.insert(params);
      if (res === undefined) throw "calendar insertion returned 'undefined'";
      resolve(res.data.id);
    } catch (e) {
      reject(
        `There was an error contacting the Calendar service to INSERT an event: ${e}`
      );
    }
  });
}

/**
 *
 * @param {GoogleEvent} eventToChange
 * @param {s.Schedule} schedule
 * @param {Discord.Client} client
 */
async function updateGoogleEvent(
  eventToChange: calendar_v3.Schema$Event,
  schedule: Schedule,
  client: Client
) {
  try {
    const description: string = await createEventDescription(schedule, client);
    const summary: string = createEventSummary(schedule);

    const params: calendar_v3.Params$Resource$Events$Update = {
      auth: jwtClient,
      calendarId: getCalendarIDByRegion(schedule.region),
      eventId: schedule.eventId === null ? undefined : schedule.eventId,
      requestBody: createEvent(
        summary,
        description,
        eventToChange.start,
        eventToChange.end
      ),
    };
    const res = await calendar?.events.update(params);
    if (res === undefined)
      throw "calendar event update returned 'undefined' while trying to get the event";

    return res;
  } catch (e) {
    console.log(e);
  }
}

/**
 * update event in google calendar api
 * @param {Schedule} schedule dfz-schedule
 * @param {Client} client discord client
 */
async function updateEvent(schedule: Schedule, client: Client) {
  return new Promise<string>(async function (resolve, reject) {
    try {
      const calendarResponse = await calendar?.events.get({
        auth: jwtClient,
        calendarId: getCalendarIDByRegion(schedule.region),
        eventId: schedule.eventId === null ? undefined : schedule.eventId,
      });
      if (calendarResponse === undefined)
        throw "calendar event update returned 'undefined' while trying to get the event";
      const updatedEvent = await updateGoogleEvent(
        calendarResponse.data,
        schedule,
        client
      );
      if (updatedEvent === undefined)
        throw "calendar insertion returned 'undefined' while trying to update the event";
      resolve("" + updatedEvent.data.id);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * delete event in google calendar api
 * @param {Schedule} schedule dfz-schedule
 */
function deleteEvent(schedule: Schedule) {
  return new Promise<string>(async function (resolve, reject) {
    try {
      const res = await calendar?.events.delete({
        auth: jwtClient,
        calendarId: getCalendarIDByRegion(schedule.region),
        eventId: schedule.eventId === null ? undefined : schedule.eventId,
      });
      if (res === undefined) throw "calendar insertion returned 'undefined'";
      resolve("" + res.data);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * create event according to Google Calendar API
 * @param {string} summary event summary
 * @param {string} description event summary
 * @param {Date} start start date-time and timezone
 * @param {Date} end end date-time and timezone
 * @param {[JSON]} attendees attendees with E-mail
 */
function createEvent(
  summary: string,
  description: string,
  start: calendar_v3.Schema$EventDateTime | undefined,
  end: calendar_v3.Schema$EventDateTime | undefined
): calendar_v3.Schema$Event {
  return {
    summary: summary,
    location: "DFZ Discord",
    description: description,
    start: start,
    end: end,
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 10 },
      ],
    },
  };
}

export const noCalendarRejection = "No Calendar";
const twoHoursInMS = 1000 * 60 * 60 * 2;
/**
 * Create calendar event given a schedule
 * @param {s.Schedule} schedule schedule
 * @param {Discord.Client} client discord client (look-up of users)
 */
export async function createCalendarEvent(schedule: Schedule, client: Client) {
  if (!calendarAvailable)
    return new Promise<string>(function (resolve, reject) {
      reject(noCalendarRejection);
    });

  const summary = createEventSummary(schedule);
  const description = await createEventDescription(schedule, client);

  // time
  const start = new Date(Number(schedule.date));
  const end = new Date(Number(schedule.date) + twoHoursInMS);
  const timeZoneString = getTimeZoneStringFromRegion(schedule.region);

  // create event
  const event = createEvent(
    summary,
    description,
    { dateTime: start.toISOString(), timeZone: timeZoneString },
    { dateTime: end.toISOString(), timeZone: timeZoneString }
  );

  // insert event in calendar
  return insertEvent(event, schedule);
}

export async function editCalendarEvent(schedule: Schedule, client: Client) {
  return new Promise<string>(function (resolve, reject) {
    if (!calendarAvailable) {
      reject(noCalendarRejection);
      return;
    }

    if (schedule.coaches.length === 0)
      deleteEvent(schedule)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    else
      updateEvent(schedule, client)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
  });
}
