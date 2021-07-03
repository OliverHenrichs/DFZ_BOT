import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { RowDataPacket } from "mysql2/promise";
import { Schedule } from "../serializables/schedule";
import { Serializer } from "./serializer";
import { SQLResultConverter } from "../database/SQLResultConverter";

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

  protected getSerializeValues(schedule: Schedule): string[] {
    return [schedule.messageId, schedule.emoji, JSON.stringify(schedule)];
  }

  protected getTypeArrayFromSQLResponse(response: RowDataPacket[]): Schedule[] {
    return SQLResultConverter.mapJSONToDataArray<Schedule>(response, Schedule);
  }

  protected getCondition(): string[] {
    var conditions = [];
    if (this.messageId !== "")
      conditions.push(`${messageColumn} = '${this.messageId}'`);
    if (this.emoji !== "") conditions.push(`${emojiColumn} = '${this.emoji}'`);
    return conditions;
  }

  protected getSerializableCondition(serializable: Schedule): string[] {
    return [
      `${messageColumn} = '${serializable.messageId}'`,
      `${emojiColumn} = '${serializable.emoji}'`,
    ];
  }

  protected getDeletionIdentifierColumns(): string[] {
    return [messageColumn, emojiColumn];
  }

  protected getSerializableDeletionValues(schedulees: Schedule[]): string[] {
    return schedulees.map(
      (schedule) => `'${schedule.messageId}','${schedule.emoji}'`
    );
  }
}

const scheduleTable = "schedules";
const scheduleColumns = ["message_id", "emoji", "data"];
const messageColumn = scheduleColumns[0];
const emojiColumn = scheduleColumns[1];
