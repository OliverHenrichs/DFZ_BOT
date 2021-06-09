import {
  DFZDataBaseClient,
  getTypedArrayFromDBResponseWithJSONData,
  SQLReturnValue,
} from "../database/DFZDataBaseClient";
import { Schedule } from "../serializables/schedule";
import { Serializer } from "./serializer";

export class ScheduleSerializer extends Serializer<Schedule> {
  emoji: string;
  messageId: string;

  constructor(
    dbClient: DFZDataBaseClient,
    messageId: string = "",
    emoji: string = ""
  ) {
    super({
      dbClient: dbClient,
      table: scheduleTable,
      columns: scheduleColumns,
      sortColumn: messageColumn,
    });
    this.messageId = messageId;
    this.emoji = emoji;
  }

  getSerializeValues(schedule: Schedule): string[] {
    return [schedule.messageId, schedule.emoji, JSON.stringify(schedule)];
  }

  getTypeArrayFromSQLResponse(response: SQLReturnValue): Schedule[] {
    return getTypedArrayFromDBResponseWithJSONData<Schedule>(
      response,
      Schedule
    );
  }

  getSerializableCondition(): string[] {
    var conditions = [];
    if (this.messageId !== "")
      conditions.push(`${messageColumn} = '${this.messageId}'`);
    if (this.emoji !== "") conditions.push(`${emojiColumn} = '${this.emoji}'`);
    return conditions;
  }

  getDeletionIdentifierColumns(): string[] {
    return [messageColumn, emojiColumn];
  }

  getSerializableDeletionValues(schedulees: Schedule[]): string[] {
    return schedulees.map(
      (schedule) => `'${schedule.messageId}','${schedule.emoji}'`
    );
  }
}

const scheduleTable = "schedules";

const scheduleColumns = ["message_id", "emoji", "data"];
const messageColumn = scheduleColumns[0];
const emojiColumn = scheduleColumns[1];
