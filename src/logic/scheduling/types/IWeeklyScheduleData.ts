export interface IWeeklyScheduleData {
  coachCount: number;
  daysByRegion: Array<Array<number>>;
  timesByRegion: Array<Array<string>>;
  channelId: string;
  type: string;
}
