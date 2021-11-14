import { Client } from "discord.js";
import { Auth, calendar_v3, google } from "googleapis";
import { getLobbyNameByType, lobbyTypes } from "../../misc/constants";
import { scheduleTypes } from "../../misc/types/scheduleTypes";
import { Schedule } from "../serializables/schedule";
import { RegionDefinitions } from "../time/RegionDefinitions";
import { getTimeZoneStringFromRegion } from "../time/timeZone";

export class GoogleCalendarManager {
  public static calendarURI = ["https://www.googleapis.com/auth/calendar"];
  public static jwtClient: Auth.JWT | undefined = undefined;
  public static calendar: calendar_v3.Calendar | undefined = undefined;
  public static calendarAvailable = true;

  public static login() {
    try {
      GoogleCalendarManager.tryLogin();
    } catch (e) {
      console.log(e);
      GoogleCalendarManager.calendarAvailable = false;
    }
  }

  private static tryLogin() {
    const privateKey = require("../../../../service_key.json");

    GoogleCalendarManager.jwtClient = new Auth.JWT(
      privateKey.client_email,
      undefined,
      privateKey.private_key,
      GoogleCalendarManager.calendarURI
    );

    if (GoogleCalendarManager.jwtClient === undefined) {
      throw "Could not auth with GoogleApi";
    }

    GoogleCalendarManager.jwtClient.authorize().then(() => {
      console.log("Successfully connected to Google API!");
      if (GoogleCalendarManager.jwtClient !== undefined)
        GoogleCalendarManager.calendar = google.calendar({ version: "v3" });
    });
  }

  public static async createCalendarEvent(
    schedule: Schedule,
    client: Client
  ): Promise<string> {
    if (!GoogleCalendarManager.calendarAvailable)
      throw new Error(GoogleCalendarManager.noCalendarReaction);

    const description = await GoogleCalendarManager.createEventDescription(
      schedule,
      client
    );
    const summary = GoogleCalendarManager.createEventSummary(schedule);

    const event = GoogleCalendarManager.createTimedEvent(
      schedule,
      summary,
      description
    );

    return GoogleCalendarManager.insertEvent(event, schedule);
  }

  private static twoHoursInMS = 1000 * 60 * 60 * 2;
  private static createTimedEvent(
    schedule: Schedule,
    summary: string,
    description: string
  ) {
    const start = new Date(Number(schedule.date));
    const end = new Date(
      Number(schedule.date) + GoogleCalendarManager.twoHoursInMS
    );
    const timeZoneString = getTimeZoneStringFromRegion(schedule.region);

    return GoogleCalendarManager.createEvent(
      summary,
      description,
      { dateTime: start.toISOString(), timeZone: timeZoneString },
      { dateTime: end.toISOString(), timeZone: timeZoneString }
    );
  }

  private static async insertEvent(
    event: calendar_v3.Schema$Event,
    schedule: Schedule
  ): Promise<string> {
    const params: calendar_v3.Params$Resource$Events$Insert = {
      auth: GoogleCalendarManager.jwtClient,
      calendarId: GoogleCalendarManager.getCalendarIDByRegion(schedule.region),
      requestBody: event,
    };

    const res = await GoogleCalendarManager.calendar?.events.insert(params);
    if (res === undefined || res.data.id === undefined || res.data.id === null)
      throw "google calendar insertion returned 'undefined'";
    return res.data.id;
  }

  private static noCalendarReaction = "Google calendar not available";

  public static async editCalendarEvent(
    schedule: Schedule,
    client: Client
  ): Promise<string | undefined> {
    if (!GoogleCalendarManager.calendarAvailable)
      throw new Error(GoogleCalendarManager.noCalendarReaction);

    if (schedule.coaches.length === 0)
      return GoogleCalendarManager.deleteEvent(schedule);
    else return GoogleCalendarManager.updateEvent(schedule, client);
  }

  /**
   * delete event in google calendar api
   * @param {Schedule} schedule dfz-schedule
   */
  private static async deleteEvent(
    schedule: Schedule
  ): Promise<string | undefined> {
    const res = await GoogleCalendarManager.calendar?.events.delete({
      auth: GoogleCalendarManager.jwtClient,
      calendarId: GoogleCalendarManager.getCalendarIDByRegion(schedule.region),
      eventId: schedule.eventId === null ? undefined : schedule.eventId,
    });
    if (res === undefined) throw "calendar deletion returned 'undefined'";
    return undefined;
  }

  /**
   * update event in google calendar api
   * @param {Schedule} schedule dfz-schedule
   * @param {Client} client discord client
   */
  private static async updateEvent(
    schedule: Schedule,
    client: Client
  ): Promise<string | undefined> {
    const calendarResponse = await GoogleCalendarManager.calendar?.events.get({
      auth: GoogleCalendarManager.jwtClient,
      calendarId: GoogleCalendarManager.getCalendarIDByRegion(schedule.region),
      eventId: schedule.eventId === null ? undefined : schedule.eventId,
    });
    if (calendarResponse === undefined)
      throw "calendar event update returned 'undefined' while trying to get the event";
    const updatedEvent = await GoogleCalendarManager.updateGoogleEvent(
      calendarResponse.data,
      schedule,
      client
    );
    if (updatedEvent === undefined)
      throw "calendar insertion returned 'undefined' while trying to update the event";

    const id = updatedEvent.data.id;
    return id ? id : undefined;
  }

  private static async updateGoogleEvent(
    eventToChange: calendar_v3.Schema$Event,
    schedule: Schedule,
    client: Client
  ) {
    const params = await GoogleCalendarManager.getEventParameters(
      eventToChange,
      schedule,
      client
    );
    const res = await GoogleCalendarManager.calendar?.events.update(params);
    if (res === undefined)
      throw "calendar event update returned 'undefined' while trying to get the event";

    return res;
  }

  private static async getEventParameters(
    eventToChange: calendar_v3.Schema$Event,
    schedule: Schedule,
    client: Client
  ): Promise<calendar_v3.Params$Resource$Events$Update> {
    const description: string =
      await GoogleCalendarManager.createEventDescription(schedule, client);
    const summary: string = GoogleCalendarManager.createEventSummary(schedule);

    return {
      auth: GoogleCalendarManager.jwtClient,
      calendarId: GoogleCalendarManager.getCalendarIDByRegion(schedule.region),
      eventId: schedule.eventId === null ? undefined : schedule.eventId,
      requestBody: GoogleCalendarManager.createEvent(
        summary,
        description,
        eventToChange.start,
        eventToChange.end
      ),
    };
  }

  private static createEvent(
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

  private static async createEventDescription(
    schedule: Schedule,
    client: Client
  ): Promise<string> {
    var coach1 = await client.users.fetch(schedule.coaches[0]);
    var coachesString = coach1.username;
    if (schedule.coaches.length > 1) {
      var coach2 = await client.users.fetch(schedule.coaches[1]);
      coachesString += " and " + coach2.username;
    }
    return `Coached by ${coachesString}`;
  }

  private static createEventSummary(schedule: Schedule): string {
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
          schedule.coaches.length == 1
            ? lobbyTypes.unranked
            : lobbyTypes.inhouse
        )} T1/T2`;
        break;
      case scheduleTypes.lobbyt3:
        lobbyTypeName = `${getLobbyNameByType(
          schedule.coaches.length == 1
            ? lobbyTypes.unranked
            : lobbyTypes.inhouse
        )} T3/T4`;
        break;
    }

    return `${schedule.region} ${lobbyTypeName} lobby`;
  }

  private static getCalendarIDByRegion(region: string) {
    if (region === RegionDefinitions.regions[0].name)
      return process.env.CALENDAR_REGION_EU;
    else if (region === RegionDefinitions.regions[1].name)
      return process.env.CALENDAR_REGION_NA;
    else if (region === RegionDefinitions.regions[2].name)
      return process.env.CALENDAR_REGION_SEA;

    return undefined;
  }
}
