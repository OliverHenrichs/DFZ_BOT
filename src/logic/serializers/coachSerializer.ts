import { RowDataPacket } from "mysql2/promise";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { SQLResultConverter } from "../database/SQLResultConverter";
import { Coach } from "../serializables/coach";
import { Serializer } from "./serializer";

export class CoachSerializer extends Serializer<Coach> {
  userId: string;

  constructor(dbClient: DFZDataBaseClient, userId: string = "") {
    super({
      dbClient: dbClient,
      table: coachTable,
      columns: coachColumns,
      sortColumn: standardSortColumn,
    });
    this.userId = userId;
  }

  protected getSerializeValues(coach: Coach): string[] {
    return [
      coach.userId,
      coach.lobbyCount.toString(),
      coach.lobbyCountTryout.toString(),
      coach.lobbyCountNormal.toString(),
      coach.lobbyCountReplayAnalysis.toString(),
    ];
  }

  protected getTypeArrayFromSQLResponse(response: RowDataPacket[]): Coach[] {
    return SQLResultConverter.mapToDataArray<Coach>(response, Coach);
  }

  protected getCondition(): string[] {
    return [`${idColumnName} = '${this.userId}'`];
  }

  protected getSerializableCondition(serializable: Coach): string[] {
    return [
      `${idColumnName} = '${serializable ? serializable.userId : this.userId}'`,
    ];
  }

  protected getDeletionIdentifierColumns(): string[] {
    return [idColumnName];
  }

  protected getSerializableDeletionValues(coaches: Coach[]): string[] {
    return coaches.map((coach) => `'${coach.userId}'`);
  }
}

const coachTable = "coaches";

const coachColumns = [
  "userId",
  "lobbyCount",
  "lobbyCountTryout",
  "lobbyCountNormal",
  "lobbyCountReplayAnalysis",
];

const idColumnName = coachColumns[0];
const standardSortColumn = coachColumns[1];
