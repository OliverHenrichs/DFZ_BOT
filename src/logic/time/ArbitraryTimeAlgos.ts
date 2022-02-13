import {CalendarDefinitions} from "./CalendarDefinitions";
import {TimeConverter} from "./TimeConverter";

// I am truly sorry for this name
export class ArbitraryTimeAlgos {
  /**
   * Thx @ https://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
   */
  public static getWeekNumber(date: Date) {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(
      ((Number(d) - Number(yearStart)) / TimeConverter.dayToMs + 1) / 7
    );
  }

  public static getCurrentMondayAndSundayDate() {
    return this.getMondayAndSundayDate("this");
  }

  /**
   * Thx @ https://stackoverflow.com/questions/4156434/javascript-get-the-first-day-of-the-week-from-current-date
   * Returns the dates for given date's current or next week's monday and sunday
   */
  private static getMondayAndSundayDate(thisOrNext: "this" | "next") {
    const sundayAdder = thisOrNext === "this" ? -6 : 1;
    const otherAdder = thisOrNext === "this" ? 1 : 8;
    const now = new Date();
    const day = now.getDay(),
      diffToMonday =
        day === CalendarDefinitions.weekDayNumbers.Sunday
          ? sundayAdder
          : otherAdder - day,
      diffToSunday = diffToMonday + 6; // sunday is six days after monday...

    const time = now.getTime();
    return {
      monday: new Date(time + diffToMonday * TimeConverter.dayToMs),
      sunday: new Date(time + diffToSunday * TimeConverter.dayToMs),
    };
  }
}
