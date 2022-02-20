import { ITimeZoneOffset } from "./ITimeZoneOffset";

export interface ITime {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  epoch: number;
  seconds?: number;
  milliseconds?: number;
  dayOfWeek?: number;
  zone?: ITimeZoneOffset;
}
