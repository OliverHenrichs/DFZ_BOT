import { Guild, Message, PartialMessage } from "discord.js";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { Player } from "../serializables/player";
import { Schedule } from "../serializables/schedule";
import { IGuildDataBaseClient } from "./types/IGuildDataBaseClient";

export namespace SerializeUtils {
  export function fromPlayertoGuildDBClient(
    player: Player,
    dbClient: DFZDataBaseClient
  ): IGuildDataBaseClient {
    return getGuildDBClient(player.guildId, dbClient);
  }

  export function fromGuildtoGuildDBClient(
    guild: Guild,
    dbClient: DFZDataBaseClient
  ): IGuildDataBaseClient {
    return getGuildDBClient(guild.id, dbClient);
  }

  export function fromMessagetoGuildDBClient(
    message: Message | PartialMessage,
    dbClient: DFZDataBaseClient
  ): IGuildDataBaseClient {
    return getGuildDBClient(message.guildId, dbClient);
  }

  export function fromScheduletoGuildDBClient(
    schedule: Schedule,
    dbClient: DFZDataBaseClient
  ): IGuildDataBaseClient {
    return getGuildDBClient(schedule.guildId, dbClient);
  }

  export function getGuildDBClient(
    guildId: string | null,
    dbClient: DFZDataBaseClient
  ): IGuildDataBaseClient {
    if (guildId === null) {
      throw new Error("No Guild id.");
    }
    return {
      guildId,
      dbClient,
    };
  }
}
