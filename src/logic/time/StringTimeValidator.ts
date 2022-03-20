import tZ = require("timezone-support");
import { ITimeZoneInfo } from "./interfaces/ITimeZoneInfo";
import { IValidatedTime } from "./interfaces/IValidatedTime";

export class StringTimeValidator {
  public static validateTimeString(timeString: string): IValidatedTime {
    const parsedTime: I_AMPMTime = this.parseTime(timeString);
    this.assertSaneTime(parsedTime);

    return this.convertTo24hTime(parsedTime);
  }

  public static validateTimeZoneString(timeZoneName: string): ITimeZoneInfo {
    try {
      const name = this.fixTimeZoneName(timeZoneName);
      return tZ.findTimeZone(name);
    } catch (err) {
      throw new Error("Invalid time zone name " + timeZoneName + ".");
    }
  }

  private static parseTime(timeString: string): I_AMPMTime {
    // check length
    const l = timeString.length;
    if (l !== 6 && l !== 7) this.throwTimeStringError();
    const res: I_AMPMTime = {
      hour: -1,
      minute: 0,
      ampm: "",
    };

    if (l === 6) {
      res.hour = parseInt(timeString[0]);
      res.minute = parseInt(timeString.substring(2, 4));
      res.ampm = timeString.substring(4);
    } else {
      res.hour = parseInt(timeString.substring(0, 2));
      res.minute = parseInt(timeString.substring(3, 5));
      res.ampm = timeString.substring(5);
    }

    return res;
  }

  private static assertSaneTime(time: I_AMPMTime) {
    if (
      isNaN(time.hour) ||
      isNaN(time.minute) ||
      (time.ampm != "am" && time.ampm != "pm") ||
      time.hour < 0 ||
      time.hour > 12 ||
      time.minute < 0 ||
      time.minute > 59
    ) {
      this.throwTimeStringError();
    }
  }

  private static convertTo24hTime(ampmTime: I_AMPMTime): IValidatedTime {
    const isAM = ampmTime.ampm === "am";
    const time = {
      hour: ampmTime.hour,
      minute: ampmTime.minute,
    };
    // 12:30 am => 00:30
    if (isAM && time.hour === 12) time.hour -= 12;
    // 1:00pm = 13:00, 11pm = 23:00
    else if (!isAM && time.hour !== 12) time.hour += 12;

    return time;
  }

  private static fixTimeZoneName(name: string): string {
    if (!name.startsWith("GMT")) return name;
    if (name.length <= 4) return "Etc/" + name;

    /*
     * POSIX-Definition causes GMT+X to be GMT-X and vice versa...
     * In order to not confuse the user we exchange + and - here
     */
    const sign = name[3];
    if (sign === "+") return "Etc/GMT-" + name.substring(4);
    else if (sign === "-") return "Etc/GMT+" + name.substring(4);

    return name; // not recognized
  }

  private static throwTimeStringError() {
    throw new Error(
      "Time string must be of format hh:mm followed by 'am' or 'pm', so e.g. 10:32am or 8:01pm"
    );
  }
}

interface I_AMPMTime {
  hour: number;
  minute: number;
  ampm: string;
}
