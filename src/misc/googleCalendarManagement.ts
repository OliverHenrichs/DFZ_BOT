import { Client } from "discord.js";
import { Auth, calendar_v3, google } from "googleapis";
import { regions, getTimeZoneStringFromRegion } from "./timeZone";
import { Schedule } from "./types/schedule";
import { scheduleTypes } from "./types/scheduleTypes";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

// const TOKEN_PATH = 'token.json';
// let oAuth2Client = "";
// // Load client secrets from a local file.
// fs.readFile('credentials.json', (err, content) => {
//   if (err) return console.log('Error loading client secret file:', err);
//   // Authorize a client with credentials, then call the Google Calendar API.
//   authorize(JSON.parse(content), listEvents);
// });

// /**
//  * Create an OAuth2 client with the given credentials, and then execute the
//  * given callback function.
//  * @param {Object} credentials The authorization client credentials.
//  * @param {function} callback The callback to call with the authorized client.
//  */
// function authorize(credentials, callback) {
//   const {client_secret, client_id, redirect_uris} = credentials.installed;
//   oAuth2Client = new google.auth.OAuth2(
//       client_id, client_secret, redirect_uris[0]);

//   // Check if we have previously stored a token.
//   fs.readFile(TOKEN_PATH, (err, token) => {
//     if (err) return getAccessToken(oAuth2Client, callback);
//     oAuth2Client.setCredentials(JSON.parse(token));
//     callback(oAuth2Client);
//   });
// }

// /**
//  * Get and store new token after prompting for user authorization, and then
//  * execute the given callback with the authorized OAuth2 client.
//  * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
//  * @param {getEventsCallback} callback The callback for the authorized client.
//  */
// // function getAccessToken(oAuth2Client, callback) {
// //   const authUrl = oAuth2Client.generateAuthUrl({
// //     access_type: 'offline',
// //     scope: SCOPES,
// //   });
// //   console.log('Authorize this app by visiting this url:', authUrl);
// //   const rl = readline.createInterface({
// //     input: process.stdin,
// //     output: process.stdout,
// //   });
// //   rl.question('Enter the code from that page here: ', (code) => {
// //     rl.close();
// //     oAuth2Client.getToken(code, (err, token) => {
// //       if (err) return console.error('Error retrieving access token', err);
// //       oAuth2Client.setCredentials(token);
// //       // Store the token to disk for later program executions
// //       fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
// //         if (err) return console.error(err);
// //         console.log('Token stored to', TOKEN_PATH);
// //       });
// //       callback(oAuth2Client);
// //     });
// //   });
// // }

// function listEvents(auth) {
//   console.log("authed with" + auth);
// }

// configure google auth client
let calendarAvailable = true;
let jwtClient: Auth.JWT | undefined = undefined;
let calendar: calendar_v3.Calendar | undefined = undefined;
try {
  // get private key
  const privateKey = require("../../service_key.json");

  jwtClient = new Auth.JWT(
    privateKey.client_email,
    undefined,
    privateKey.private_key,
    SCOPES
  );

  if (jwtClient === undefined) {
    throw "Could not auth with GoogleApi";
  }

  // authenticate client on startup
  jwtClient.authorize().then(() => {
    console.log("Successfully connected to Google API!");
    if (jwtClient !== undefined) calendar = google.calendar({ version: "v3" });
  });
} catch (e) {
  console.log(e);
  calendarAvailable = false;
}

/**
 * returns calendar id for respective region
 * @param {string} region region string
 */
function getCalendarIDByRegion(region: string) {
  if (region === regions[0]) return process.env.CALENDAR_REGION_EU;
  else if (region === regions[1]) return process.env.CALENDAR_REGION_NA;
  else if (region === regions[2]) return process.env.CALENDAR_REGION_SEA;

  return undefined;
}

function createEventSummary(schedule: Schedule) {
  var lobbyType = "";

  if (schedule.type === scheduleTypes.tryout) lobbyType = "tryout lobby";
  else if (schedule.type === scheduleTypes.botbash) lobbyType = "botbash lobby";
  else if (schedule.type === "lobbies") {
    if (schedule.coaches.length == 1) lobbyType = "unranked lobby";
    else lobbyType = "5v5 lobby";
  } else if (schedule.type === scheduleTypes.lobbyt1) {
    if (schedule.coaches.length == 1) lobbyType = "unranked T1/T2 lobby";
    else lobbyType = "5v5 T1/T2 lobby";
  } else if (schedule.type === scheduleTypes.lobbyt3) {
    if (schedule.coaches.length == 1) lobbyType = "unranked T3/T4 lobby";
    else lobbyType = "5v5 T3/T4 lobby";
  }

  return schedule.region + " " + lobbyType;
}

/**
 * returns an event description containing the coaches' names
 * @param {Schedule} schedule lobby schedule
 * @param {Client} client discord client
 */
async function getEventDescription(schedule: Schedule, client: Client) {
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
      console.log(
        "There was an error contacting the Calendar service to INSERT an event: " +
          e
      );
      reject(
        "There was an error contacting the Calendar service to INSERT an event: " +
          e
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
    const description: string = await getEventDescription(schedule, client);
    const params: calendar_v3.Params$Resource$Events$Update = {
      auth: jwtClient,
      calendarId: getCalendarIDByRegion(schedule.region),
      eventId: schedule.eventId === null ? undefined : schedule.eventId,
      requestBody: createEvent(
        createEventSummary(schedule),
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
      const res = await calendar?.events.get({
        auth: jwtClient,
        calendarId: getCalendarIDByRegion(schedule.region),
        eventId: schedule.eventId === null ? undefined : schedule.eventId,
      });
      if (res === undefined)
        throw "calendar event update returned 'undefined' while trying to get the event";
      const res2 = await updateGoogleEvent(res.data, schedule, client);
      if (res2 === undefined)
        throw "calendar insertion returned 'undefined' while trying to update the event";
      resolve("" + res2.data.id);
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
  end: calendar_v3.Schema$EventDateTime | undefined,
  attendees: calendar_v3.Schema$EventAttendee[] = []
) {
  return {
    summary: summary,
    location: "DFZ Discord",
    description: description,
    start: start,
    end: end,
    attendees: attendees,
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

  var summary = createEventSummary(schedule);

  var description = await getEventDescription(schedule, client);

  // attendees
  // TODO: google impersonation for personal invites
  var attendees: calendar_v3.Schema$EventAttendee[] = []; //{email: "ohenrichs@gmail.com"}];

  // time
  var start = new Date(Number(schedule.date));
  var end = new Date(Number(schedule.date) + 1000 * 60 * 60 * 2); // 2h later
  var timeZoneString = getTimeZoneStringFromRegion(schedule.region);

  // create event
  var event = createEvent(
    summary,
    description,
    { dateTime: start.toISOString(), timeZone: timeZoneString },
    { dateTime: end.toISOString(), timeZone: timeZoneString },
    attendees
  );

  // insert event in calendar
  return insertEvent(event, schedule);
}

export async function editCalendarEvent(schedule: Schedule, client: Client) {
  if (!calendarAvailable)
    return new Promise<string>(function (resolve, reject) {
      reject(noCalendarRejection);
    });

  if (schedule.coaches.length === 0)
    return new Promise<string>(function (resolve, reject) {
      deleteEvent(schedule)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  else
    return new Promise<string>(function (resolve, reject) {
      updateEvent(schedule, client)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
}
