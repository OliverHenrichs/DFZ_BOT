import { RowDataPacket } from "mysql2/promise";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { SQLResultConverter } from "../database/SQLResultConverter";
import { Player } from "../serializables/player";
import { Serializer } from "./serializer";

export class PlayerSerializer extends Serializer<Player> {
  userId: string;

  constructor(dbClient: DFZDataBaseClient, userId: string = "") {
    super({
      dbClient: dbClient,
      table: playerTable,
      columns: playerColumns,
      sortColumn: standardSortColumn,
    });
    this.userId = userId;
  }

  protected getSerializeValues(player: Player): string[] {
    return [
      player.userId,
      player.tag,
      player.referredBy,
      player.referralLock.toString(),
      player.lobbyCount.toString(),
      player.lobbyCountUnranked.toString(),
      player.lobbyCountBotBash.toString(),
      player.lobbyCount5v5.toString(),
      player.lobbyCountReplayAnalysis.toString(),
      player.offenses.toString(),
    ];
  }

  protected getTypeArrayFromSQLResponse(response: RowDataPacket[]): Player[] {
    return SQLResultConverter.mapToDataArray<Player>(response, Player);
  }

  protected getCondition(): string[] {
    return [`${idColumnName} = '${this.userId}'`];
  }

  protected getSerializableCondition(serializable: Player): string[] {
    return [`${idColumnName} = '${serializable.userId}'`];
  }

  protected getDeletionIdentifierColumns(): string[] {
    return [idColumnName];
  }

  protected getSerializableDeletionValues(playeres: Player[]): string[] {
    return playeres.map((player) => `'${player.userId}'`);
  }
}

const playerTable = "players";

const playerColumns = [
  "userId",
  "tag",
  "referredBy",
  "referralLock",
  "lobbyCount",
  "lobbyCountUnranked",
  "lobbyCountBotBash",
  "lobbyCount5v5",
  "lobbyCountReplayAnalysis",
  "offenses",
];
const idColumnName = playerColumns[0];
const standardSortColumn = playerColumns[4];
