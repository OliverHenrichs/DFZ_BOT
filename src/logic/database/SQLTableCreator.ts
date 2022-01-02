import { Pool } from "mysql2/promise";
import { CoachSerializerIds } from "../serializers/types/CoachSerializerIds";
import { LobbySerializerIds } from "../serializers/types/LobbySerializerIds";
import { PlayerSerializerIds } from "../serializers/types/PlayerSerializerIds";
import { ReferrerSerializerIds } from "../serializers/types/ReferrerSerializerIds";
import { ScheduleSerializerIds } from "../serializers/types/ScheduleSerializerIds";
import { SerializerIds } from "../serializers/types/SerializerIds";
import { ISqlTableColumn } from "./interfaces/SqlTableColumn";

export class SQLTableCreator {
  static createPlayerTable(dbHandle: Pool) {
    var json = this.getPlayerTable();
    return this.createTable(dbHandle, json.tableName, json.tableColumns);
  }

  static createReferrerTable(dbHandle: Pool) {
    var json = this.getReferrerTable();
    return this.createTable(dbHandle, json.tableName, json.tableColumns);
  }

  static createCoachTable(dbHandle: Pool) {
    var json = this.getCoachTable();
    return this.createTable(dbHandle, json.tableName, json.tableColumns);
  }

  static createScheduleTable(dbHandle: Pool) {
    var json = this.getScheduleTable();
    return this.createTable(dbHandle, json.tableName, json.tableColumns);
  }

  static createLobbyTable(dbHandle: Pool) {
    var json = this.getLobbyTable();
    return this.createTable(dbHandle, json.tableName, json.tableColumns);
  }

  static createOptionsTable(dbHandle: Pool) {
    var json = this.getOptionsTable();
    return this.createTable(dbHandle, json.tableName, json.tableColumns);
  }

  /**
   * Creates new table in mysql-database
   * @param {Pool} dbHandle bot database handle
   * @param {string} tableName name of table
   * @param {Array<String>} tableColumns names of table columns
   */
  private static async createTable(
    dbHandle: Pool,
    tableName: string,
    tableColumns: Array<ISqlTableColumn>
  ) {
    var command = this.createCreateTableCommand(tableName, tableColumns);
    return dbHandle.execute(command);
  }

  private static createCreateTableCommand(
    tableName: string,
    tableColumns: Array<ISqlTableColumn>
  ) {
    var command = `CREATE TABLE IF NOT EXISTS ${tableName} (`;
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

  private static getReferrerTable(): {
    tableName: string;
    tableColumns: ISqlTableColumn[];
  } {
    return {
      tableName: ReferrerSerializerIds.table,
      tableColumns: [
        {
          id: SerializerIds.guild,
          type: "VARCHAR(255)",
        },
        {
          id: ReferrerSerializerIds.userColumn,
          type: "VARCHAR(255)",
        },
        {
          id: ReferrerSerializerIds.tagColumn,
          type: "VARCHAR(255)",
        },
        {
          id: ReferrerSerializerIds.refCountColumn,
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
