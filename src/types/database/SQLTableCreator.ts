import { Pool } from "mysql2/promise";

export class SQLTableCreator {
  static createPlayerTable(dbHandle: Pool) {
    var json = getPlayerTable();
    return createTable(dbHandle, json.tableName, json.tableColumns);
  }

  static createReferrerTable(dbHandle: Pool) {
    var json = getReferrerTable();
    return createTable(dbHandle, json.tableName, json.tableColumns);
  }

  static createCoachTable(dbHandle: Pool) {
    var json = getCoachTable();
    return createTable(dbHandle, json.tableName, json.tableColumns);
  }

  static createScheduleTable(dbHandle: Pool) {
    var json = getScheduleTable();
    return createTable(dbHandle, json.tableName, json.tableColumns);
  }

  static createLobbyTable(dbHandle: Pool) {
    var json = getLobbyTable();
    return createTable(dbHandle, json.tableName, json.tableColumns);
  }

  static createOptionsTable(dbHandle: Pool) {
    var json = getOptionsTable();
    return createTable(dbHandle, json.tableName, json.tableColumns);
  }
}

interface SqlTableColumn {
  id: string;
  type: string;
}

/**
 * Creates new table in mysql-database
 * @param {Pool} dbHandle bot database handle
 * @param {string} tableName name of table
 * @param {Array<String>} tableColumns names of table columns
 */
async function createTable(
  dbHandle: Pool,
  tableName: string,
  tableColumns: Array<SqlTableColumn>
) {
  var command = createCreateTableCommand(tableName, tableColumns);
  return dbHandle.execute(command);
}

function createCreateTableCommand(
  tableName: string,
  tableColumns: Array<SqlTableColumn>
) {
  var command = "CREATE TABLE IF NOT EXISTS " + tableName + " (";
  command += tableName + "_id INT AUTO_INCREMENT, ";
  tableColumns.forEach((col) => {
    command += col.id + " " + col.type + ", ";
  });
  command += "INDEX(" + tableName + "_id)) ENGINE=INNODB;";
  return command;
}

function getCoachTable(): {
  tableName: string;
  tableColumns: SqlTableColumn[];
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

function getPlayerTable(): {
  tableName: string;
  tableColumns: SqlTableColumn[];
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

function getReferrerTable(): {
  tableName: string;
  tableColumns: SqlTableColumn[];
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

function getScheduleTable(): {
  tableName: string;
  tableColumns: SqlTableColumn[];
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

function getLobbyTable(): {
  tableName: string;
  tableColumns: SqlTableColumn[];
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

function getOptionsTable(): {
  tableName: string;
  tableColumns: SqlTableColumn[];
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
