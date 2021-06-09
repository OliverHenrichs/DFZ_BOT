/**
 * Just some pod that make up a schedule
 */
export class Schedule {
  channelId: string;
  messageId: string;
  type: string;
  coachCount: number;
  emoji: string;
  date: string;
  region: string;
  coaches: string[];
  lobbyPosted: boolean;
  eventId: undefined | null | string;

  constructor(
    channelId: string = "",
    messageId: string = "",
    type: string = "",
    coachCount: number = 0,
    emoji: string = "",
    date: string = "",
    region: string = "",
    eventId = undefined
  ) {
    this.channelId = channelId;
    this.messageId = messageId;
    this.type = type;
    this.coachCount = coachCount;
    this.emoji = emoji;
    this.date = date;
    this.region = region;
    this.coaches = [];
    this.lobbyPosted = false;
    this.eventId = eventId;
  }
}
