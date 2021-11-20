import { Pool } from "mysql2/promise";
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
      tableName: "coaches",
      tableColumns: [
        {
          id: "userId",
          type: "VARCHAR(255)",
        },
        {
          id: "lobbyCount",
          type: "int",
        },
        {
          id: "lobbyCountTryout",
          type: "int",
        },
        {
          id: "lobbyCountNormal",
          type: "int",
        },
        {
          id: "lobbyCountReplayAnalysis",
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
      tableName: "players",
      tableColumns: [
        {
          id: "userId",
          type: "VARCHAR(255)",
        },
        {
          id: "tag",
          type: "VARCHAR(255)",
        },
        {
          id: "referredBy",
          type: "VARCHAR(255)",
        },
        {
          id: "referralLock",
          type: "TINYINT(1)",
        },
        {
          id: "lobbyCount",
          type: "int",
        },
        {
          id: "lobbyCountUnranked",
          type: "int",
        },
        {
          id: "lobbyCountBotBash",
          type: "int",
        },
        {
          id: "lobbyCount5v5",
          type: "int",
        },
        {
          id: "lobbyCountReplayAnalysis",
          type: "int",
        },
        {
          id: "offenses",
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
      tableName: "referrers",
      tableColumns: [
        {
          id: "userId",
          type: "VARCHAR(255)",
        },
        {
          id: "tag",
          type: "VARCHAR(255)",
        },
        {
          id: "referralCount",
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
          id: "emoji",
          type: "VARCHAR(255)",
        },
        {
          id: "message_id",
          type: "VARCHAR(255)",
        },
        {
          id: "data",
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
      tableName: "lobbies",
      tableColumns: [
        {
          id: "channel_id",
          type: "VARCHAR(255)",
        },
        {
          id: "message_id",
          type: "VARCHAR(255)",
        },
        {
          id: "data",
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
