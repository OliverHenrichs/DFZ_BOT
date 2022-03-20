import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { Schedule } from "../serializables/Schedule";
import { ScheduleSerializer } from "../serializers/ScheduleSerializer";
import { IGuildDataBaseClient } from "../serializers/interfaces/IGuildDataBaseClient";
import { TimeConverter } from "../time/TimeConverter";

export class ScheduleRemover {
  public static async tryRemoveDeprecatedSchedules(
    dbClient: DFZDataBaseClient
  ) {
    try {
      const yesterday = new Date(Date.now() - TimeConverter.dayToMs);
      await ScheduleRemover.removeDeprecatedSchedules(yesterday, dbClient);
    } catch (e) {
      console.warn(`Error in tryRemoveDeprecatedSchedules\nReason:\n${e}`);
    }
  }

  private static async removeDeprecatedSchedules(
    deprecationDate: Date,
    dbClient: DFZDataBaseClient
  ) {
    const gdbc: IGuildDataBaseClient = { dbClient, guildId: "" }; // guild id empty, remove all deprecated schedules.
    const serializer = new ScheduleSerializer(gdbc);
    const schedules = await serializer.get();

    const schedulesToRemove: Array<Schedule> = [];
    for (let i = 0; i < schedules.length; i++) {
      const scheduleDate = new Date(parseInt(schedules[i].date));
      if (scheduleDate < deprecationDate) schedulesToRemove.push(schedules[i]);
    }

    if (schedulesToRemove.length === 0) return;

    serializer.delete(schedulesToRemove);
  }
}
