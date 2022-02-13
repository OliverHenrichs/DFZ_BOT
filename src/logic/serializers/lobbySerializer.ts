import { RowDataPacket } from "mysql2/promise";
import { SQLResultConverter } from "../database/SQLResultConverter";
import { Lobby } from "../serializables/lobby";
import { Serializer } from "./Serializer";
import { IGuildDataBaseClient } from "./types/IGuildDataBaseClient";
import { LobbySerializerIds } from "./types/LobbySerializerIds";
import { SerializerIds } from "./types/SerializerIds";

export class LobbySerializer extends Serializer<Lobby> {
  channelId: string;
  messageId: string;

  constructor(
    gdbc: IGuildDataBaseClient,
    channelId: string = "",
    messageId: string = ""
  ) {
    super({
      dbClient: gdbc.dbClient,
      guildId: gdbc.guildId,
      table: lobbyTable,
      columns: lobbyColumns,
      sortColumn: LobbySerializerIds.channelColumn,
    });
    this.channelId = channelId;
    this.messageId = messageId;
  }

  protected getSerializeValues(lobby: Lobby): string[] {
    const serializedLobby = JSON.stringify(lobby);
    return [lobby.channelId, lobby.messageId, serializedLobby];
  }

  protected getTypeArrayFromSQLResponse(response: RowDataPacket[]): Lobby[] {
    return SQLResultConverter.mapJSONToDataArray<Lobby>(response, Lobby);
  }

  protected getCondition(): string[] {
    const conditions = [];
    if (this.channelId !== "")
      conditions.push(
        `${LobbySerializerIds.channelColumn} = '${this.channelId}'`
      );
    if (this.messageId !== "")
      conditions.push(
        `${LobbySerializerIds.messageColumn} = '${this.messageId}'`
      );
    return conditions;
  }

  protected getSerializableCondition(serializable: Lobby): string[] {
    return [
      `${LobbySerializerIds.channelColumn} = '${serializable.channelId}'`,
      `${LobbySerializerIds.messageColumn} = '${serializable.messageId}'`,
    ];
  }

  protected getDeletionIdentifierColumns(): string[] {
    return [LobbySerializerIds.channelColumn, LobbySerializerIds.messageColumn];
  }

  protected getSerializableDeletionValues(lobbies: Lobby[]): string[] {
    return lobbies.map((lobby) => `'${lobby.channelId}','${lobby.messageId}'`);
  }
}

const lobbyTable = LobbySerializerIds.table;
const lobbyColumns = [
  LobbySerializerIds.channelColumn,
  LobbySerializerIds.messageColumn,
  SerializerIds.dataColumn,
];
