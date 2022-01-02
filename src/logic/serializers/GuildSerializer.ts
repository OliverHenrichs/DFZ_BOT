import { RowDataPacket } from "mysql2/promise";
import { SQLResultConverter } from "../database/SQLResultConverter";
import { Guild } from "../serializables/Guild";
import { Serializer } from "./Serializer";
import { GuildSerializerIds } from "./types/GuildSerializerIds";
import { IGuildDataBaseClient } from "./types/IGuildDataBaseClient";
import { SerializerIds } from "./types/SerializerIds";

export class GuildSerializer extends Serializer<Guild> {
  constructor(gdbc: IGuildDataBaseClient) {
    super({
      dbClient: gdbc.dbClient,
      guildId: gdbc.guildId,
      table: GuildSerializerIds.table,
      columns: guildColumns,
      sortColumn: SerializerIds.guild,
    });
  }

  protected getSerializeValues(guild: Guild): string[] {
    return [
      guild.guildId,
      guild.tryoutRole,
      guild.tierRoles.toString(),
      guild.coachRoles.toString(),
      guild.lesserCoachRoles.toString(),
      guild.regionsAndChannels.toString(),
      guild.lobbyChannels.toString(),
      guild.leaderboardChannel,
    ];
  }

  protected getTypeArrayFromSQLResponse(response: RowDataPacket[]): Guild[] {
    return SQLResultConverter.mapToDataArray<Guild>(response, Guild);
  }

  protected getCondition(): string[] {
    return [`${SerializerIds.guild} = '${this.settings.guildId}'`];
  }

  protected getSerializableCondition(serializable: Guild): string[] {
    return [`${SerializerIds.guild} = '${serializable.guildId}'`];
  }

  protected getDeletionIdentifierColumns(): string[] {
    return [SerializerIds.guild];
  }

  protected getSerializableDeletionValues(guilds: Guild[]): string[] {
    return guilds.map((guild) => `'${guild.guildId}'`);
  }
}

const guildColumns = [
  GuildSerializerIds.tryoutRole,
  GuildSerializerIds.tierRoles,
  GuildSerializerIds.coachRoles,
  GuildSerializerIds.lesserCoachRoles,
  GuildSerializerIds.regionsAndChannels,
  GuildSerializerIds.lobbyChannels,
  GuildSerializerIds.leaderboardChannel,
];
