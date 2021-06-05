import tZ = require("timezone-support");

export const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const weekDayNumbers = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// get current time zone short names (daylight savings time vs normal time)
export const regions = ["EU", "NA", "SEA"];
export const regionStrings = ["🇪🇺 EU", "🇺🇸 NA", "🌏 SEA"];
export const scheduleTimezoneNames = [
  "Europe/Berlin",
  "America/New_York",
  "Asia/Singapore",
];

export const scheduleTimezoneNames_short = getTimeZoneShortNames(
  scheduleTimezoneNames
);

export function getTimeZoneShortNames(timezoneNames: Array<string>) {
  var date = Date.now();
  var timezoneShortNames: Array<string> = [];
  timezoneNames.forEach((name) => {
    // get time zone
    const zone = findTimeZone(name);
    if (zone === undefined) return undefined;

    // get correct time zone abbreviation
    var abbr = tZ.getUTCOffset(date, zone).abbreviation;
    if (abbr === "+08") abbr = "SGT";
    else if (abbr !== undefined && (abbr[0] == "+" || abbr[0] == "-"))
      abbr = "UTC" + abbr;

    timezoneShortNames.push(abbr !== undefined ? abbr : "");
  });
  return timezoneShortNames;
}

interface ValidatedTime {
  hour: number | undefined;
  minute: number | undefined;
}

/**
 * Validates that time string has form xxam, xam, xpm xxpm (x in 0,..,9)
 * @param {string} timeString input string
 * @return true if validator succeeds
 */
function validateTime(timeString: string) {
  var res: ValidatedTime = { hour: undefined, minute: undefined };

  // check length
  var l = timeString.length;
  if (l != 6 && l != 7) return res;

  // check sanity
  var hour = -1,
    minute = 0,
    ampm = "";

  if (l == 6) {
    hour = parseInt(timeString[0]);
    minute = parseInt(timeString.substring(2, 4));
    ampm = timeString.substring(4);
  } else {
    hour = parseInt(timeString.substring(0, 2));
    minute = parseInt(timeString.substring(3, 5));
    ampm = timeString.substring(5);
  }
  if (
    isNaN(hour) ||
    isNaN(minute) ||
    (ampm != "am" && ampm != "pm") ||
    hour < 0 ||
    hour > 12 ||
    minute < 0 ||
    minute > 59
  ) {
    return res;
  }

  // determine time
  if (ampm === "am") {
    if (hour === 12) {
      res.hour = hour - 12;
      res.minute = minute;
    } // 12:30 am => 00:30
    else {
      res.hour = hour;
      res.minute = minute;
    } // 1am = 1:00, 10am = 10:00
  } else {
    if (hour === 12) {
      res.hour = hour;
      res.minute = minute;
    } // 12:30pm = 12:30
    else {
      res.hour = hour + 12;
      res.minute = minute;
    } // 1:00pm = 13:00, 11pm = 23:00
  }

  return res;
}

function findTimeZone(timezoneName: string) {
  /*
   * POSIX-Definition causes GMT+X to be GMT-X and vice versa...
   * In order to not confuse the user we exchange + and - here
   */
  if (timezoneName.startsWith("GMT")) {
    if (timezoneName.length > 4) {
      var sign = timezoneName[3];
      if (sign == "+") timezoneName = "Etc/GMT-" + timezoneName.substr(4);
      else if (sign == "-") timezoneName = "Etc/GMT+" + timezoneName.substr(4);
    } else {
      timezoneName = "Etc/" + timezoneName;
    }
  }

  var zone = undefined;
  try {
    zone = tZ.findTimeZone(timezoneName);
  } catch (err) {
    console.log(err.message);
  }

  return zone;
}

export interface TimeZoneOffset {
  abbreviation?: string;
  offset: number;
}

export interface Time {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds?: number;
  milliseconds?: number;
  dayOfWeek?: number;
  epoch: number;
  zone?: TimeZoneOffset;
}

interface TimeZoneInfo {
  name: string;
}

export function getTimeString(zonedTime: Time) {
  const { dayOfWeek, month, day, hours, minutes } = zonedTime;
  return `${weekDays[dayOfWeek ? dayOfWeek : 0]}, ${
    months[month > 0 ? month - 1 : month]
  } ${day} at ${hours}:${minutes < 10 ? "0" + minutes : minutes}`;
}

const minInMs = 1000 * 60;
const hInMs = minInMs * 60;
const dayInMs = hInMs * 24;

export interface NextMondayAndSunday {
  monday: Date;
  sunday: Date;
}

export function getTimeZoneStringFromRegion(_region: string) {
  var idx = regions.findIndex((region) => {
    return region === _region;
  });
  if (idx === -1) return scheduleTimezoneNames[0];

  return scheduleTimezoneNames[idx];
}

/**
 * Thx @ https://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
 * @param {Date} date
 */
export function getWeekNumber(date: Date) {
  var d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((Number(d) - Number(yearStart)) / dayInMs + 1) / 7);
}

/**
 * Thx @ https://stackoverflow.com/questions/4156434/javascript-get-the-first-day-of-the-week-from-current-date
 * Returns the dates for given date's next week's monday and sunday
 */
export function getNextMondayAndSundayDate() {
  var now = new Date();
  var day = now.getDay(),
    diffToMondayNextWeek = day == 0 ? 1 : 8 - day,
    diffToSundayOfNextWeek = diffToMondayNextWeek + 6;

  return {
    monday: new Date(Date.now() + diffToMondayNextWeek * dayInMs),
    sunday: new Date(Date.now() + diffToSundayOfNextWeek * dayInMs),
  };
}

/**
 *
 * @param {date} mondayDate start date of the schedule week
 * @param {int} day week day of schedule
 * @param {string} timeString time of schedule
 * @param {string} timezoneName time zone name
 */
export function getScheduledDate(
  mondayDate: Date,
  day: number,
  timeString: string,
  timezoneName: string
) {
  const hourAndMinute: ValidatedTime = validateTime(timeString);
  if (hourAndMinute.hour === undefined || hourAndMinute.minute === undefined)
    return undefined;

  // get time zone
  const zone = findTimeZone(timezoneName);
  if (zone === undefined) return undefined;

  // set date
  var scheduledDate = new Date(mondayDate);
  var newDate = scheduledDate.getDate() + (day == 0 ? 6 : day - 1);
  scheduledDate.setDate(newDate);
  scheduledDate.setHours(hourAndMinute.hour);
  scheduledDate.setMinutes(
    hourAndMinute.minute - scheduledDate.getTimezoneOffset()
  ); // remove time zone offset of server, offset given in minutes

  // transform into correct time zone
  var scheduledDateZoned = tZ.setTimeZone(scheduledDate, zone, {
    useUTC: true,
  });

  //var diff = (scheduledDateZoned.epoch - utcDate)/1000;
  return scheduledDateZoned.epoch;
}

/**
 * use user given time to derive a UTC time for lobby
 * @param {string} time time string
 * @param {string} timezoneName timezone name
 */
export function createLobbyTime(
  time: string,
  timezoneName: string
): LobbyTimeResult {
  const hourAndMinute: ValidatedTime = validateTime(time);
  if (hourAndMinute.hour === undefined || hourAndMinute.minute === undefined)
    throw "You need to provide a valid time (e.g. 9:30pm, 6:04am, ...) in your post";

  const zone = findTimeZone(timezoneName);
  if (zone === undefined) throw `Could not find time zone '${timezoneName}'`;

  var date = new Date();
  var zonedDate = tZ.getZonedTime(date, zone);
  if (zonedDate.epoch === undefined) throw `Could not get zoned time`;

  // check if hour, minute has already past in their time zone
  var timeDif =
    (hourAndMinute.hour - zonedDate.hours) * hInMs +
    (hourAndMinute.minute - zonedDate.minutes) * minInMs;
  if (timeDif < 0) timeDif = dayInMs + timeDif; // go for next day if it did

  var lobbyDate = new Date(zonedDate.epoch + timeDif);
  const lobbyTime = getZonedTime(lobbyDate, zone);

  return {
    time: lobbyTime,
    timeZoneName: zone.name,
  };
}

export interface LobbyTimeResult {
  time: Time;
  timeZoneName: string;
}

/**
 *
 * @param {Date} date
 * @param {tZ.timezone} timezone
 */
export function getZonedTime(
  date: Date | number,
  timezone: TimeZoneInfo
): Time {
  const zonedTime = tZ.getZonedTime(date, timezone);
  if (zonedTime.epoch === undefined)
    throw `Could not get zoned time because epoch is undefined`;
  return zonedTime as Time;
}

/**
 * Returns time in given time zone if time zone name is being recognized
 * @param {Date} date
 * @param {string} timezoneName
 * @return {tZ.Time} zoned time
 */
export function getZonedTimeFromTimeZoneName(
  date: Date | number,
  timezoneName: string
): Time | undefined {
  const zone = findTimeZone(timezoneName);
  if (zone === undefined)
    throw `Could not get zoned time because epoch is undefined`;

  return getZonedTime(date, zone);
}
