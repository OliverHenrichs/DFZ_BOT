import { RowDataPacket } from "mysql2/promise";
import { SQLResultConverter } from "../database/SQLResultConverter";
import { Player } from "../serializables/Player";
import { Serializer } from "./Serializer";
import { IGuildDataBaseClient } from "./interfaces/IGuildDataBaseClient";
import { PlayerSerializerIds } from "./enums/PlayerSerializerIds";

export class PlayerSerializer extends Serializer<Player> {
  userId: string;

  constructor(gdbc: IGuildDataBaseClient, userId: string = "") {
    super({
      dbClient: gdbc.dbClient,
      guildId: gdbc.guildId,
      table: PlayerSerializerIds.table,
      columns: playerColumns,
      sortColumn: PlayerSerializerIds.lobbyCountColumn,
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
    return [`${PlayerSerializerIds.tagColumn} = '${this.userId}'`];
  }

  protected getSerializableCondition(serializable: Player): string[] {
    return [`${PlayerSerializerIds.tagColumn} = '${serializable.userId}'`];
  }

  protected getDeletionIdentifierColumns(): string[] {
    return [PlayerSerializerIds.tagColumn];
  }

  protected getSerializableDeletionValues(playeres: Player[]): string[] {
    return playeres.map((player) => `'${player.userId}'`);
  }
}

const playerColumns = [
  PlayerSerializerIds.userColumn,
  PlayerSerializerIds.tagColumn,
  PlayerSerializerIds.referredByColumn,
  PlayerSerializerIds.referralLockColumn,
  PlayerSerializerIds.lobbyCountColumn,
  PlayerSerializerIds.lobbyCountUnrankedColumn,
  PlayerSerializerIds.lobbyCountBotBashColumn,
  PlayerSerializerIds.lobbyCount5v5Column,
  PlayerSerializerIds.lobbyCountReplayAnalysisColumn,
  PlayerSerializerIds.offensesColumn,
];
