import { Serializable } from "./Serializable";

export class Schedule extends Serializable {
  public channelId: string;
  public messageId: string;
  public type: string;
  public coachCount: number;
  public emoji: string;
  public date: string;
  public region: string;
  public coaches: string[];
  public lobbyPosted: boolean;
  public eventId: undefined | null | string;

  constructor(
    guildId: string,
    channelId: string = "",
    messageId: string = "",
    type: string = "",
    coachCount: number = 0,
    emoji: string = "",
    date: string = "",
    region: string = "",
    eventId = undefined
  ) {
    super(guildId);
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
