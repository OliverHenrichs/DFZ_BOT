import { RowDataPacket } from "mysql2/promise";
import { SQLResultConverter } from "../database/SQLResultConverter";
import { Schedule } from "../serializables/schedule";
import { Serializer } from "./Serializer";
import { IGuildDataBaseClient } from "./types/IGuildDataBaseClient";
import { ScheduleSerializerIds } from "./types/ScheduleSerializerIds";
import { SerializerIds } from "./types/SerializerIds";

export class ScheduleSerializer extends Serializer<Schedule> {
  emoji: string;
  messageId: string;

  constructor(
    gdbc: IGuildDataBaseClient,
    messageId: string = "",
    emoji: string = ""
  ) {
    super({
      dbClient: gdbc.dbClient,
      guildId: gdbc.guildId,
      table: scheduleTable,
      columns: scheduleColumns,
      sortColumn: ScheduleSerializerIds.messageColumn,
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
    const conditions = [];
    if (this.messageId !== "")
      conditions.push(
        `${ScheduleSerializerIds.messageColumn} = '${this.messageId}'`
      );
    if (this.emoji !== "")
      conditions.push(`${ScheduleSerializerIds.emojiColumn} = '${this.emoji}'`);
    return conditions;
  }

  protected getSerializableCondition(serializable: Schedule): string[] {
    return [
      `${ScheduleSerializerIds.messageColumn} = '${serializable.messageId}'`,
      `${ScheduleSerializerIds.emojiColumn} = '${serializable.emoji}'`,
    ];
  }

  protected getDeletionIdentifierColumns(): string[] {
    return [
      ScheduleSerializerIds.messageColumn,
      ScheduleSerializerIds.emojiColumn,
    ];
  }

  protected getSerializableDeletionValues(schedulees: Schedule[]): string[] {
    return schedulees.map(
      (schedule) => `'${schedule.messageId}','${schedule.emoji}'`
    );
  }
}

const scheduleTable = ScheduleSerializerIds.table;
const scheduleColumns = [
  ScheduleSerializerIds.messageColumn,
  ScheduleSerializerIds.emojiColumn,
  SerializerIds.dataColumn,
];
