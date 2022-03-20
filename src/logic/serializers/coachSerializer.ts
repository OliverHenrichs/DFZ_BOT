import { RowDataPacket } from "mysql2/promise";
import { SQLResultConverter } from "../database/SQLResultConverter";
import { Coach } from "../serializables/Coach";
import { Serializer } from "./Serializer";
import { CoachSerializerIds } from "./enums/CoachSerializerIds";
import { IGuildDataBaseClient } from "./interfaces/IGuildDataBaseClient";

export class CoachSerializer extends Serializer<Coach> {
  userId: string;

  constructor(gdbc: IGuildDataBaseClient, userId: string = "") {
    super({
      dbClient: gdbc.dbClient,
      guildId: gdbc.guildId,
      table: CoachSerializerIds.table,
      columns: coachColumns,
      sortColumn: CoachSerializerIds.lobbyCountColumn,
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
    return [`${CoachSerializerIds.userColumn} = '${this.userId}'`];
  }

  protected getSerializableCondition(serializable: Coach): string[] {
    return [
      `${CoachSerializerIds.userColumn} = '${
        serializable ? serializable.userId : this.userId
      }'`,
    ];
  }

  protected getDeletionIdentifierColumns(): string[] {
    return [CoachSerializerIds.userColumn];
  }

  protected getSerializableDeletionValues(coaches: Coach[]): string[] {
    return coaches.map((coach) => `'${coach.userId}'`);
  }
}

const coachColumns = [
  CoachSerializerIds.userColumn,
  CoachSerializerIds.lobbyCountColumn,
  CoachSerializerIds.lobbyCountTryoutColumn,
  CoachSerializerIds.lobbyCountNormalColumn,
  CoachSerializerIds.lobbyCountReplayAnalysisColumn,
];
