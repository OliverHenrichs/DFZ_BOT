const { google } = require("googleapis");
const tz = require("./timeZone");
const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const s = require("./schedule");

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
let jwtClient = "";
let calendar = "";
try {
  // get private key
  const privateKey = require("./../service_key.json");

  jwtClient = new google.auth.JWT(
    privateKey.client_email,
    null,
    privateKey.private_key,
    SCOPES
  );

  // authenticate client on startup
  jwtClient.authorize().then((tokens) => {
    console.log("Successfully connected to Google API!");
    calendar = google.calendar({ version: "v3", jwtClient });
  });
} catch (e) {
  console.log(e);
  calendarAvailable = false;
}

/**
 * returns calendar id for respective region
 * @param {string} region region string
 */
function getCalendarIDByRegion(region) {
  if (region === tz.regions[0]) return process.env.CALENDAR_REGION_EU;
  else if (region === tz.regions[1]) return process.env.CALENDAR_REGION_NA;
  else if (region === tz.regions[2]) return process.env.CALENDAR_REGION_SEA;

  return undefined;
}

function createEventSummary(schedule) {
  var lobbyType = "";

  if (schedule.type === "Tryouts") lobbyType = "tryout lobby";
  else if (schedule.type === "Botbash") lobbyType = "botbash lobby";
  else if (schedule.coaches.length == 1) lobbyType = "unranked lobby";
  else lobbyType = "5v5 lobby";

  return schedule.region + " " + lobbyType;
}

/**
 * returns an event description containing the coaches' names
 * @param {s.Schedule} schedule lobby schedule
 * @param {Discord.Client} client discord client
 */
async function getEventDescription(schedule, client) {
  return new Promise(async function (resolve, reject) {
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
function insertEvent(event, schedule) {
  return new Promise(function (resolve, reject) {
    calendar.events.insert(
      {
        auth: jwtClient,
        calendarId: getCalendarIDByRegion(schedule.region),
        resource: event,
      },
      function (err, event) {
        if (err) {
          console.log(
            "There was an error contacting the Calendar service to INSERT an event: " +
              err
          );
          reject(
            "There was an error contacting the Calendar service to INSERT an event: " +
              err
          );
        } else resolve(event.data.id);
      }
    );
  });
}

/**
 *
 * @param {GoogleEvent} eventToChange
 * @param {s.Schedule} schedule
 * @param {Discord.Client} client
 */
async function updateGoogleEvent(eventToChange, schedule, client) {
  return new Promise(async function (resolve, reject) {
    try {
      description = await getEventDescription(schedule, client);
      res = await calendar.events.update({
        auth: jwtClient,
        calendarId: getCalendarIDByRegion(schedule.region),
        eventId: schedule.eventId,
        requestBody: createEvent(
          createEventSummary(schedule),
          description,
          eventToChange.data.start,
          eventToChange.data.end,
          (attendees = [])
        ),
      });
      resolve(res);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * update event in google calendar api
 * @param {s.Schedule} schedule dfz-schedule
 * @param {Discord.Client} client discord client
 */
async function updateEvent(schedule, client) {
  return new Promise(function (resolve, reject) {
    calendar.events
      .get({
        auth: jwtClient,
        calendarId: getCalendarIDByRegion(schedule.region),
        eventId: schedule.eventId,
      })
      .then((eventToChange) =>
        updateGoogleEvent(eventToChange, schedule, client)
      )
      .then((res) => resolve(res.data.id))
      .catch((err) => reject(err));
  });
}

/**
 * delete event in google calendar api
 * @param {s.Schedule} schedule dfz-schedule
 */
function deleteEvent(schedule) {
  return new Promise(function (resolve, reject) {
    calendar.events
      .delete({
        auth: jwtClient,
        calendarId: getCalendarIDByRegion(schedule.region),
        eventId: schedule.eventId,
      })
      .then((res) => resolve(res.data.id))
      .catch((err) => reject(err));
  });
}

/**
 * create event according to Google Calendar API
 * @param {string} summary event summary
 * @param {string} description event summary
 * @param {JSON} start start date-time and timezone
 * @param {JSON} end end date-time and timezone
 * @param {[JSON]} attendees attendees with E-mail
 */
function createEvent(summary, description, start, end, attendees = []) {
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

const noCalendarRejection = "No Calendar";
module.exports = {
  noCalendarRejection: noCalendarRejection,
  /**
   * Create calendar event given a schedule
   * @param {s.Schedule} schedule schedule
   * @param {Discord.Client} client discord client (look-up of users)
   */
  createCalendarEvent: async function (schedule, client) {
    if (!calendarAvailable)
      return new Promise(function (resolve, reject) {
        reject(noCalendarRejection);
      });

    var summary = createEventSummary(schedule);

    var description = await getEventDescription(schedule, client);

    // attendees
    // TODO: google impersonation for personal invites
    var attendees = []; //{email: "ohenrichs@gmail.com"}];

    // time
    var start = new Date(schedule.date);
    var end = new Date(schedule.date + 1000 * 60 * 60 * 2); // 2h later
    var timeZoneString = tz.getTimeZoneStringFromRegion(schedule.region);

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
  },

  editCalendarEvent: async function (schedule, client) {
    if (!calendarAvailable)
      return new Promise(function (resolve, reject) {
        reject(noCalendarRejection);
      });

    if (schedule.coaches.length === 0)
      return new Promise(function (resolve, reject) {
        deleteEvent(schedule)
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      });
    else
      return new Promise(function (resolve, reject) {
        updateEvent(schedule, client)
          .then((res) => resolve(res))
          .catch((err) => reject(err));
      });
  },
};
