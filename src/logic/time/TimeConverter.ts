export class TimeConverter {
  static msToMin = 1 / (1000 * 60);
  static msToHours = TimeConverter.msToMin / 60;
  static minToMs = 1000 * 60;
  static hToMs = TimeConverter.minToMs * 60;
  static dayToMs = TimeConverter.hToMs * 24;
}

export enum TimeInMs {
  oneSecond = 1000,
  twoSeconds = 2 * TimeInMs.oneSecond,
  oneMinute = 60 * TimeInMs.oneSecond,
  fiveMinutes = 5 * TimeInMs.oneMinute,
  tenMinutes = 10 * TimeInMs.oneMinute,
  fifteenMinutes = 15 * TimeInMs.oneMinute,
  oneHour = 60 * TimeInMs.oneMinute,
  twoHours = 2 * TimeInMs.oneHour,
}
