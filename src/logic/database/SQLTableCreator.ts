import { Pool } from "mysql2/promise";
import { CoachSerializerIds } from "../serializers/enums/CoachSerializerIds";
import { GuildSerializerIds } from "../serializers/enums/GuildSerializerIds";
import { LobbySerializerIds } from "../serializers/enums/LobbySerializerIds";
import { PlayerSerializerIds } from "../serializers/enums/PlayerSerializerIds";
import { ScheduleSerializerIds } from "../serializers/enums/ScheduleSerializerIds";
import { SerializerIds } from "../serializers/enums/SerializerIds";
import { ISqlTableColumn } from "./interfaces/ISqlTableColumn";

export class SQLTableCreator {
  public static async tryCreateDataBaseTables(pool: Pool) {
    try {
      await SQLTableCreator.createDataBaseTables(pool);
    } catch (error) {
      console.log(`Failed creating database tables with error: ${error}`);
    }
  }

  private static async createDataBaseTables(pool: Pool) {
    await SQLTableCreator.createScheduleTable(pool);
    await SQLTableCreator.createLobbyTable(pool);
    await SQLTableCreator.createOptionsTable(pool);
    await SQLTableCreator.createCoachTable(pool);
    await SQLTableCreator.createPlayerTable(pool);
    await SQLTableCreator.createGuildTable(pool);
  }

  private static createPlayerTable(dbHandle: Pool) {
    const json = this.getPlayerTable();
    return this.createTable(dbHandle, json.tableName, json.tableColumns);
  }

  private static createCoachTable(dbHandle: Pool) {
    const json = this.getCoachTable();
    return this.createTable(dbHandle, json.tableName, json.tableColumns);
  }

  private static createScheduleTable(dbHandle: Pool) {
    const json = this.getScheduleTable();
    return this.createTable(dbHandle, json.tableName, json.tableColumns);
  }

  private static createLobbyTable(dbHandle: Pool) {
    const json = this.getLobbyTable();
    return this.createTable(dbHandle, json.tableName, json.tableColumns);
  }

  private static createOptionsTable(dbHandle: Pool) {
    const json = this.getOptionsTable();
    return this.createTable(dbHandle, json.tableName, json.tableColumns);
  }

  private static createGuildTable(dbHandle: Pool) {
    const json = this.getGuildTable();
    return this.createTable(dbHandle, json.tableName, json.tableColumns);
  }

  private static async createTable(
    dbHandle: Pool,
    tableName: string,
    tableColumns: Array<ISqlTableColumn>
  ) {
    const command = this.createCreateTableCommand(tableName, tableColumns);
    return dbHandle.execute(command);
  }

  private static createCreateTableCommand(
    tableName: string,
    tableColumns: Array<ISqlTableColumn>
  ) {
    let command = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
    command += tableName + "_id INT AUTO_INCREMENT, ";

    tableColumns.forEach((col) => {
      command += `${col.id} ${col.type}, `;
    });
    command += `INDEX(${tableName}_id)) ENGINE=INNODB;`;
    return command;
  }

  private static getCoachTable(): {
    tableName: string;
    tableColumns: ISqlTableColumn[];
  } {
    return {
      tableName: CoachSerializerIds.table,
      tableColumns: [
        {
          id: SerializerIds.guild,
          type: "VARCHAR(255)",
        },
        {
          id: CoachSerializerIds.userColumn,
          type: "VARCHAR(255)",
        },
        {
          id: CoachSerializerIds.lobbyCountColumn,
          type: "int",
        },
        {
          id: CoachSerializerIds.lobbyCountTryoutColumn,
          type: "int",
        },
        {
          id: CoachSerializerIds.lobbyCountNormalColumn,
          type: "int",
        },
        {
          id: CoachSerializerIds.lobbyCountReplayAnalysisColumn,
          type: "int",
        },
      ],
    };
  }

  private static getGuildTable(): {
    tableName: string;
    tableColumns: ISqlTableColumn[];
  } {
    return {
      tableName: GuildSerializerIds.table,
      tableColumns: [
        {
          id: SerializerIds.guild,
          type: "VARCHAR(255)",
        },
        {
          id: GuildSerializerIds.tryoutRole,
          type: "VARCHAR(255)",
        },
        {
          id: GuildSerializerIds.tierRoles,
          type: "VARCHAR(255)",
        },
        {
          id: GuildSerializerIds.coachRoles,
          type: "VARCHAR(255)",
        },
        {
          id: GuildSerializerIds.lesserCoachRoles,
          type: "VARCHAR(255)",
        },
        {
          id: GuildSerializerIds.regionsAndChannels,
          type: "VARCHAR(255)",
        },
        {
          id: GuildSerializerIds.lobbyChannels,
          type: "VARCHAR(255)",
        },
        {
          id: GuildSerializerIds.leaderboardChannel,
          type: "VARCHAR(255)",
        },
      ],
    };
  }

  private static getPlayerTable(): {
    tableName: string;
    tableColumns: ISqlTableColumn[];
  } {
    return {
      tableName: PlayerSerializerIds.table,
      tableColumns: [
        {
          id: SerializerIds.guild,
          type: "VARCHAR(255)",
        },
        {
          id: PlayerSerializerIds.userColumn,
          type: "VARCHAR(255)",
        },
        {
          id: PlayerSerializerIds.tagColumn,
          type: "VARCHAR(255)",
        },
        {
          id: PlayerSerializerIds.referredByColumn,
          type: "VARCHAR(255)",
        },
        {
          id: PlayerSerializerIds.referralLockColumn,
          type: "TINYINT(1)",
        },
        {
          id: PlayerSerializerIds.lobbyCountColumn,
          type: "int",
        },
        {
          id: PlayerSerializerIds.lobbyCountUnrankedColumn,
          type: "int",
        },
        {
          id: PlayerSerializerIds.lobbyCountBotBashColumn,
          type: "int",
        },
        {
          id: PlayerSerializerIds.lobbyCount5v5Column,
          type: "int",
        },
        {
          id: PlayerSerializerIds.lobbyCountReplayAnalysisColumn,
          type: "int",
        },
        {
          id: PlayerSerializerIds.offensesColumn,
          type: "int",
        },
      ],
    };
  }

  private static getScheduleTable(): {
    tableName: string;
    tableColumns: ISqlTableColumn[];
  } {
    return {
      tableName: "schedules",
      tableColumns: [
        {
          id: SerializerIds.guild,
          type: "VARCHAR(255)",
        },
        {
          id: ScheduleSerializerIds.emojiColumn,
          type: "VARCHAR(255)",
        },
        {
          id: ScheduleSerializerIds.messageColumn,
          type: "VARCHAR(255)",
        },
        {
          id: SerializerIds.dataColumn,
          type: "JSON",
        },
      ],
    };
  }

  private static getLobbyTable(): {
    tableName: string;
    tableColumns: ISqlTableColumn[];
  } {
    return {
      tableName: LobbySerializerIds.table,
      tableColumns: [
        {
          id: SerializerIds.guild,
          type: "VARCHAR(255)",
        },
        {
          id: LobbySerializerIds.channelColumn,
          type: "VARCHAR(255)",
        },
        {
          id: LobbySerializerIds.messageColumn,
          type: "VARCHAR(255)",
        },
        {
          id: SerializerIds.dataColumn,
          type: "JSON",
        },
      ],
    };
  }

  private static getOptionsTable(): {
    tableName: string;
    tableColumns: ISqlTableColumn[];
  } {
    return {
      tableName: "options",
      tableColumns: [
        {
          id: "name",
          type: "VARCHAR(255)",
        },
        {
          id: "value",
          type: "VARCHAR(255)",
        },
      ],
    };
  }
}
