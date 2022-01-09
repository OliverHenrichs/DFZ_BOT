export interface IScheduleSetup {
  mondayDate: Date;
  sundayDate: Date;
  type: string;
  coachCount: number;
  data: IScheduleData[];
}

export interface IScheduleData {
  days: Array<number>;
  regionString: string;
  region: string;
  times: Array<string>;
  timezoneShortName: string;
  timezone: string;
}
