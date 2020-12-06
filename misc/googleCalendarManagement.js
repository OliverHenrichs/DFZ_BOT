
// const readline = require('readline');
// const fs = require('fs')
const { google } = require('googleapis');
const tz = require('./timeZone');
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

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
const privateKey = require('./../service_key.json');
let jwtClient = new google.auth.JWT(
  privateKey.client_email,
  null,
  privateKey.private_key,
  SCOPES
);

// authenticate client on startup
jwtClient.authorize(function (err, tokens) {
  if (err) {
    console.log(err);
    return;
  } else {
    console.log("Successfully connected to Google API!");
  }
});

/**
 * returns calendar id for respective region
 * @param {string} region region string
 */
function getCalendarIDByRegion(region)
{
  if(region === tz.regions[0])
    return process.env.CALENDAR_REGION_EU;
  else if (region === tz.regions[1])
    return process.env.CALENDAR_REGION_NA;
  else if (region === tz.regions[2])
    return process.env.CALENDAR_REGION_SEA;

  return undefined;
}

/**
 * returns an event description containing the coaches' names
 * @param {*} schedule lobby schedule
 * @param {*} client discord client
 */
async function getEventDescription(schedule, client)
{
    var coach1 = await client.fetchUser(schedule.coaches[0]);
    var coachesString = coach1.username;
    if(schedule.coaches.length > 1)
    {
      var coach2 = await client.fetchUser(schedule.coaches[1]);
      coachesString += " and " + coach2.username;
    }
    return "Coached by " + coachesString;
}
/**
 * insert event in google calendar api
 * @param {*} event scheduled event in google api format
 * @param {*} cal_ID calender ID 
 * @param {*} schedule dfz-schedule
 */
function insertEvent(event, schedule) {
  const calendar = google.calendar({ version: 'v3', jwtClient });
  calendar.events.insert({
    auth: jwtClient,
    calendarId: getCalendarIDByRegion(schedule.region),
    resource: event,
  }, function (err, event) {
    if (err) {
      console.log('There was an error contacting the Calendar service to INSERT an event: ' + err);
      return;
    }
    schedule.event_ID = event.data.id;
  });
}

/**
 * update event in google calendar api
 * @param {*} schedule dfz-schedule
 * @param {*} client discord client
 */
function updateEvent(schedule, client) {
  const calendar = google.calendar({ version: 'v3', jwtClient });

  getEventDescription(schedule, client)
  .then(description => {
    calendar.events.get({
      auth: jwtClient,
      calendarId: getCalendarIDByRegion(schedule.region),
      eventId: schedule.event_ID,
    })
    .then(eventToChange => {      
      calendar.events.update({
        auth: jwtClient,
        calendarId: getCalendarIDByRegion(schedule.region),
        eventId: schedule.event_ID,
        requestBody: createEvent(eventToChange.data.summary, description, eventToChange.data.start, eventToChange.data.end, attendees = []),
      }, function (err) {
        if (err) {
          console.log('There was an error contacting the Calendar service to UPDATE an event: ' + err);
          return;
        }
      });
    });
  });
}

/**
 * delete event in google calendar api
 * @param {*} schedule dfz-schedule
 */
function deleteEvent(schedule)
{
  const calendar = google.calendar({ version: 'v3', jwtClient });
  calendar.events.delete({
    auth: jwtClient,
    calendarId: getCalendarIDByRegion(schedule.region),
    eventId: schedule.event_ID,
  }, function (err) {
    if (err) {
      console.log('There was an error contacting the Calendar service to DELETE an event: ' + err);
      return;
    }
    schedule.event_ID = undefined;
  });
}

/**
 * create event according to Google Calendar API
 * @param {string} summary event summary
 * @param {string} description event summary
 * @param {json} start start date-time and timezone
 * @param {json} end end date-time and timezone
 * @param {[json]} attendees attendees with E-mail
 */
function createEvent(summary, description, start, end, attendees = []) {
  return {
    'summary': summary,
    'location': 'DFZ Discord',
    'description': description,
    'start': start,
    'end': end,
    'attendees': attendees,
    'reminders': {
      'useDefault': false,
      'overrides': [
        { 'method': 'email', 'minutes': 24 * 60 },
        { 'method': 'popup', 'minutes': 10 }
      ]
    }
  }
}

module.exports = {
  /**
   * Create calendar event given a dfz-schedule 
   * @param {*} schedule dfz-schedule
   * @param {*} client discord client (look-up of users)
   */
  createCalendarEvent: async function(schedule, client) {
    
    // lobby type
    var lobbyType = (schedule.type === "Tryouts" ? "Tryout lobby" : "5v5-lobby");
    var summary = schedule.region + " " + lobbyType;

    // description 
    var description = await getEventDescription(schedule, client);

    // attendees
    // TODO: google impersonation for personal invites
    var attendees = [];//{email: "ohenrichs@gmail.com"}];

    // time
    var start = new Date(schedule.date);
    var end = new Date(schedule.date + 1000*60*60*2); // 2h later
    var timeZoneString = tz.getTimeZoneStringFromRegion(schedule.region);
    
    // create event
    var event = createEvent(summary, description, {'dateTime':start.toISOString(),'timeZone': timeZoneString }, {'dateTime':end.toISOString(),'timeZone': timeZoneString}, attendees);

    // insert event in calendar
    insertEvent(event, schedule);
  },

  editCalendarEvent: function(schedule, client) {
    if(schedule.coaches.length === 0)
      deleteEvent(schedule);
    else  
      updateEvent(schedule, client);
  }
}


