import tZ = require("timezone-support");
import { CalendarDefinitions } from "./CalendarDefinitions";
import { ILobbyTimeResult } from "./interfaces/LobbyTimeResult";
import { ITime } from "./interfaces/Time";
import { ITimeZoneInfo } from "./interfaces/TimeZoneInfo";
import { IValidatedTime } from "./interfaces/ValidatedTime";
import { RegionDefinitions } from "./RegionDefinitions";
import { StringTimeValidator } from "./StringTimeValidator";
import { TimeConverter } from "./TimeConverter";

export const scheduleTimezoneNames_short = getTimeZoneShortNames(
  RegionDefinitions.scheduleTimezoneNames
);

export function getTimeZoneShortNames(timezoneNames: Array<string>) {
  var date = Date.now();
  var timezoneShortNames: Array<string> = [];
  timezoneNames.forEach((name) => {
    const zone = StringTimeValidator.validateTimeZoneString(name);

    // get correct time zone abbreviation
    var abbr = tZ.getUTCOffset(date, zone).abbreviation;
    if (abbr === "+08") abbr = "SGT";
    else if (abbr !== undefined && (abbr[0] === "+" || abbr[0] === "-"))
      abbr = "UTC" + abbr;

    timezoneShortNames.push(abbr !== undefined ? abbr : "");
  });
  return timezoneShortNames;
}

export function getTimeString(zonedTime: ITime) {
  const { dayOfWeek, month, day, hours, minutes } = zonedTime;
  return `${CalendarDefinitions.weekDays[dayOfWeek ? dayOfWeek : 0]}, ${
    CalendarDefinitions.months[month > 0 ? month - 1 : month]
  } ${day} at ${hours}:${minutes < 10 ? "0" + minutes : minutes}`;
}

export interface NextMondayAndSunday {
  monday: Date;
  sunday: Date;
}

export function getTimeZoneStringFromRegion(_region: string) {
  var idx = RegionDefinitions.regions.findIndex((region) => {
    return region === _region;
  });
  if (idx === -1) return RegionDefinitions.scheduleTimezoneNames[0];

  return RegionDefinitions.scheduleTimezoneNames[idx];
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
  const hourAndMinute: IValidatedTime =
    StringTimeValidator.validateTimeString(timeString);
  if (hourAndMinute.hour === undefined || hourAndMinute.minute === undefined)
    return undefined;

  // get time zone
  const zone = StringTimeValidator.validateTimeZoneString(timezoneName);

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
export function calculateLobbyTime(
  time: string,
  timezoneName: string
): ILobbyTimeResult {
  const hourAndMinute: IValidatedTime =
    StringTimeValidator.validateTimeString(time);

  const zone = StringTimeValidator.validateTimeZoneString(timezoneName);

  var date = new Date();
  var zonedDate = tZ.getZonedTime(date, zone);
  if (zonedDate.epoch === undefined) throw `Could not get zoned time`;

  // check if hour, minute has already past in their time zone
  var timeDif =
    (hourAndMinute.hour - zonedDate.hours) * TimeConverter.hToMs +
    (hourAndMinute.minute - zonedDate.minutes) * TimeConverter.minToMs;
  if (timeDif < 0) timeDif = TimeConverter.dayToMs + timeDif; // go for next day if it did

  var lobbyDate = new Date(zonedDate.epoch + timeDif);
  const lobbyTime = getZonedTime(lobbyDate, zone);

  return {
    time: lobbyTime,
    timeZoneName: zone.name,
  };
}

/**
 *
 * @param {Date} date
 * @param {tZ.timezone} timezone
 */
function getZonedTime(date: Date | number, timezone: ITimeZoneInfo): ITime {
  const zonedTime = tZ.getZonedTime(date, timezone);
  if (zonedTime.epoch === undefined)
    throw `Could not get zoned time because epoch is undefined`;
  return zonedTime as ITime;
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
): ITime | undefined {
  const zone = StringTimeValidator.validateTimeZoneString(timezoneName);
  return getZonedTime(date, zone);
}
