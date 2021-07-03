import { RowDataPacket } from "mysql2/promise";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { SQLResultConverter } from "../database/SQLResultConverter";
import { Lobby } from "../serializables/lobby";
import { Serializer } from "./serializer";

export class LobbySerializer extends Serializer<Lobby> {
  channelId: string;
  messageId: string;

  constructor(
    dbClient: DFZDataBaseClient,
    channelId: string = "",
    messageId: string = ""
  ) {
    super({
      dbClient: dbClient,
      table: lobbyTable,
      columns: lobbyColumns,
      sortColumn: channelIdColumn,
    });
    this.channelId = channelId;
    this.messageId = messageId;
  }

  protected getSerializeValues(lobby: Lobby): string[] {
    return [lobby.channelId, lobby.messageId, JSON.stringify(lobby)];
  }

  protected getTypeArrayFromSQLResponse(response: RowDataPacket[]): Lobby[] {
    return SQLResultConverter.mapJSONToDataArray<Lobby>(response, Lobby);
  }

  protected getCondition(): string[] {
    var conditions = [];
    if (this.channelId !== "")
      conditions.push(`${channelIdColumn} = '${this.channelId}'`);
    if (this.messageId !== "")
      conditions.push(`${messageIdColumn} = '${this.messageId}'`);
    return conditions;
  }

  protected getSerializableCondition(serializable: Lobby): string[] {
    return [
      `${channelIdColumn} = '${serializable.channelId}'`,
      `${messageIdColumn} = '${serializable.messageId}'`,
    ];
  }

  protected getDeletionIdentifierColumns(): string[] {
    return [channelIdColumn, messageIdColumn];
  }

  protected getSerializableDeletionValues(lobbies: Lobby[]): string[] {
    return lobbies.map((lobby) => `'${lobby.channelId}','${lobby.messageId}'`);
  }
}

const lobbyTable = "lobbies";
const lobbyColumns = ["channel_id", "message_id", "data"];
const channelIdColumn = lobbyColumns[0];
const messageIdColumn = lobbyColumns[1];
