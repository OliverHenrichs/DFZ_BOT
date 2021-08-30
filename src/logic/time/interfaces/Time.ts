import { ITimeZoneOffset } from "./TimeZoneOffset";

export interface ITime {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds?: number;
  milliseconds?: number;
  dayOfWeek?: number;
  epoch: number;
  zone?: ITimeZoneOffset;
}
