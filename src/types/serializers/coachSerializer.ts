import {
  DFZDataBaseClient,
  getTypedArrayFromDBResponse,
  SQLReturnValue,
} from "../database/DFZDataBaseClient";
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

  getSerializeValues(coach: Coach): string[] {
    return [
      coach.userId,
      coach.lobbyCount.toString(),
      coach.lobbyCountTryout.toString(),
      coach.lobbyCountNormal.toString(),
      coach.lobbyCountReplayAnalysis.toString(),
    ];
  }

  getTypeArrayFromSQLResponse(response: SQLReturnValue): Coach[] {
    return getTypedArrayFromDBResponse<Coach>(response, Coach);
  }

  getSerializableCondition(): string[] {
    return [`${idColumnName} = '${this.userId}'`];
  }

  getDeletionIdentifierColumns(): string[] {
    return [idColumnName];
  }

  getSerializableDeletionValues(coaches: Coach[]): string[] {
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
