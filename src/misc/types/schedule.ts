/**
 * Just some pod that make up a schedule
 */
class Schedule {
  channelId: string;
  messageId: string;
  type: string;
  coachCount: number;
  emoji: string;
  date: string;
  region: string;
  coaches: any[];
  lobbyPosted: boolean;
  eventId: undefined | string;

  /**
   * constructor
   * @param {string} channelId
   * @param {string} messageId
   * @param {string} type
   * @param {number} coachCount
   * @param {string} emoji
   * @param {string} date
   * @param {string} region
   */
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
  }

  static fromObject(obj: any) {
    if (obj == null) return;
    var schedule: Schedule = new Schedule();
    Object.assign(schedule, obj);
    return schedule;
  }
}
module.exports = {
  Schedule,
};
