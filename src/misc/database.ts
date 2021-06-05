import {
  Pool,
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
  FieldPacket,
  createPool,
} from "mysql2/promise";
import { Lobby } from "./types/lobby";
import { Player } from "./types/player";
import { Referrer } from "./types/referrer";
import { Schedule } from "./types/schedule";
import { Coach } from "./types/coach";

interface SqlTableColumn {
  id: string;
  type: string;
}

function getCoachTableJson() {
  return {
    table_name: "coaches",
    table_columns: [
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

function getPlayerTableJson() {
  return {
    table_name: "players",
    table_columns: [
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

function getReferrerTableJson() {
  return {
    table_name: "referrers",
    table_columns: [
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

function getScheduleTableJson() {
  return {
    table_name: "schedules",
    table_columns: [
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

function getLobbyTableJson() {
  return {
    table_name: "lobbies",
    table_columns: [
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

function getOptionsTableJson() {
  return {
    table_name: "options",
    table_columns: [
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

export function createPlayerTable(dbHandle: Pool) {
  var json = getPlayerTableJson();
  return createTable(dbHandle, json.table_name, json.table_columns);
}

export function createReferrerTable(dbHandle: Pool) {
  var json = getReferrerTableJson();
  return createTable(dbHandle, json.table_name, json.table_columns);
}

export function createCoachTable(dbHandle: Pool) {
  var json = getCoachTableJson();
  return createTable(dbHandle, json.table_name, json.table_columns);
}

export function createScheduleTable(dbHandle: Pool) {
  var json = getScheduleTableJson();
  return createTable(dbHandle, json.table_name, json.table_columns);
}

export function createLobbyTable(dbHandle: Pool) {
  var json = getLobbyTableJson();
  return createTable(dbHandle, json.table_name, json.table_columns);
}

export function createOptionsTable(dbHandle: Pool) {
  var json = getOptionsTableJson();
  return createTable(dbHandle, json.table_name, json.table_columns);
}

/**
 * @param {string} tableName table to return
 * @param {string} column column to sort by
 * @returns sorted table
 */
function getSortedTableCommand(tableName: string, columnName: string) {
  //SELECT * FROM table_name ORDER BY column_name ASC|DESC
  return "SELECT * FROM " + tableName + " ORDER BY " + columnName + " DESC";
}

/**
 * Compiles table name and columns into a mysql-command
 * @param {string} table_name name of table
 * @param {Array<String>} table_columns names of table columns
 */
function createCreateTableCommand(
  table_name: string,
  table_columns: Array<SqlTableColumn>
) {
  var command = "CREATE TABLE IF NOT EXISTS " + table_name + " (";
  command += table_name + "_id INT AUTO_INCREMENT, ";
  table_columns.forEach((col) => {
    command += col.id + " " + col.type + ", ";
  });
  command += "INDEX(" + table_name + "_id)) ENGINE=INNODB;";
  return command;
}
/**
 *
 * @param {Pool} dbHandle dbHandle bot database handle
 * @param {string} command
 */
async function executeDBCommand(dbHandle: Pool, command: string) {
  return new Promise<
    [
      (
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket
        | OkPacket[]
        | ResultSetHeader
      ),
      FieldPacket[]
    ]
  >(function (resolve, reject) {
    dbHandle
      .execute(
        command
          .replace(/[\\]/g, "\\\\")
          .replace(/[\/]/g, "\\/")
          .replace(/[\b]/g, "\\b")
          .replace(/[\f]/g, "\\f")
          .replace(/[\n]/g, "\\n")
          .replace(/[\r]/g, "\\r")
          .replace(/[\t]/g, "\\t")
      )
      .then((res) => resolve(res))
      .catch((err) => {
        console.log(
          "Could not execute MYSQL-command.\nReason: " +
            err +
            "\ncommand: " +
            command
        );
        reject(err);
      });
  });
}

/**
 * Creates new table in mysql-database
 * @param {Pool} dbHandle bot database handle
 * @param {string} table_name name of table
 * @param {Array<String>} table_columns names of table columns
 */
async function createTable(
  dbHandle: Pool,
  table_name: string,
  table_columns: Array<SqlTableColumn>
) {
  var command = createCreateTableCommand(table_name, table_columns);
  return dbHandle.execute(command);
}

/**
 * Executes insert command in mysql-db
 * @param {Pool} dbHandle bot database handle
 * @param {string} table table id
 * @param {Array<String>} columnNames column IDs
 * @param {(string | number)[]} columnValues column values
 */
async function insertRow(
  dbHandle: Pool,
  table: string,
  columnNames: Array<String>,
  columnValues: (string | number)[]
) {
  var command =
    "INSERT INTO " +
    table +
    "( " +
    columnNames.join(", ") +
    ") VALUES('" +
    columnValues.join("', '") +
    "');";
  return executeDBCommand(dbHandle, command);
}

/**
 * inserts coach into database
 * @param {Pool} dbHandle bot database handle
 * @param {Array<String>} values
 */
async function insertCoachRow(dbHandle: Pool, values: (string | number)[]) {
  return insertRow(
    dbHandle,
    "coaches",
    [
      "userId",
      "lobbyCount",
      "lobbyCountTryout",
      "lobbyCountNormal",
      "lobbyCountReplayAnalysis",
    ],
    values
  );
}

/**
 * inserts player into database
 * @param {Pool} dbHandle bot database handle
 * @param {(string | number)[]} values
 */
async function insertPlayerRow(dbHandle: Pool, values: (string | number)[]) {
  return insertRow(
    dbHandle,
    "players",
    [
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
    ],
    values
  );
}

/**
 * inserts player into database
 * @param {Pool} dbHandle bot database handle
 * @param {(string | number)[]} values
 */
async function insertReferrerRow(dbHandle: Pool, values: (string | number)[]) {
  return insertRow(
    dbHandle,
    "referrers",
    ["userId", "tag", "referralCount"],
    values
  );
}

/**
 * inserts lobby into database
 * @param {Pool} dbHandle bot database handle
 * @param {(string | number)[]} values values for channel_id, message_id and data
 */
async function insertLobbyRow(dbHandle: Pool, values: (string | number)[]) {
  return insertRow(
    dbHandle,
    "lobbies",
    ["channel_id", "message_id", "data"],
    values
  );
}

/**
 * inserts schedule into database
 * @param {Pool} dbHandle bot database handle
 * @param {(string | number)[]} values values for emoji, messageId and data
 */
async function insertScheduleRow(dbHandle: Pool, values: (string | number)[]) {
  return insertRow(
    dbHandle,
    "schedules",
    ["emoji", "message_id", "data"],
    values
  );
}

/**
 * Insert coach into DB
 * @param {Pool} dbHandle
 * @param {Coach} coach
 */
export async function insertCoach(dbHandle: Pool, coach: Coach) {
  const values = [
    coach.userId,
    coach.lobbyCount,
    coach.lobbyCountTryout,
    coach.lobbyCountNormal,
    coach.lobbyCountReplayAnalysis,
  ];
  return insertCoachRow(dbHandle, values);
}

/**
 * Insert player into DB
 * @param {Pool} dbHandle
 * @param {Player} player
 */
export async function insertPlayer(dbHandle: Pool, player: Player) {
  const values = [
    player.userId,
    player.tag,
    player.referredBy,
    player.referralLock,
    player.lobbyCount,
    player.lobbyCountUnranked,
    player.lobbyCountBotBash,
    player.lobbyCount5v5,
    player.lobbyCountReplayAnalysis,
    player.offenses,
  ];
  return insertPlayerRow(dbHandle, values);
}

/**
 * Insert referrer into DB
 * @param {Pool} dbHandle
 * @param {Referrer} referrer
 */
export async function insertReferrer(dbHandle: Pool, referrer: Referrer) {
  const values = [referrer.userId, referrer.tag, referrer.referralCount];
  return insertReferrerRow(dbHandle, values);
}

/**
 * Insert lobby into DB
 * @param {Pool} dbHandle
 * @param {Lobby} lobby
 */
export async function insertLobby(dbHandle: Pool, lobby: Lobby) {
  const values = [lobby.channelId, lobby.messageId, JSON.stringify(lobby)];
  return insertLobbyRow(dbHandle, values);
}

/**
 * Insert schedule into DB
 * @param {Pool} dbHandle
 * @param {Schedule} schedule
 */
export async function insertSchedule(dbHandle: Pool, schedule: Schedule) {
  const values = [schedule.emoji, schedule.messageId, JSON.stringify(schedule)];
  return insertScheduleRow(dbHandle, values);
}

/**
 * Setup function for day in options in database
 * @param {Pool} dbHandle bot database handle
 * @param {number} day day
 */
export async function insertDay(dbHandle: Pool, day: number) {
  return insertRow(dbHandle, "options", ["name", "value"], ["day", day]);
}

/**
 * updates a table with new values according to given conditions
 * @param {Pool} dbHandle bot database handle
 * @param {string} table table id
 * @param {Array<string>} columns column ids
 * @param {(string | number)[]} values new values
 * @param {Array<string>} conditions array of strings containing sql conditions
 */
async function updateTableEntriesByConditions(
  dbHandle: Pool,
  table: string,
  columns: Array<string>,
  values: (string | number)[],
  conditions: Array<string>
) {
  return new Promise<
    [
      (
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket
        | OkPacket[]
        | ResultSetHeader
      ),
      FieldPacket[]
    ]
  >(function (resolve, reject) {
    var command = "Update " + table + " SET ";
    let cols = columns.length;
    if (cols === 0 || cols !== values.length) {
      reject("#columns must equal #values");
    }
    for (let i = 0; i < cols; i++) {
      command += columns[i] + "=" + values[i] + (i < cols - 1 ? ", " : "");
    }

    if (conditions.length > 0) {
      command += " WHERE ";
      conditions.forEach((condition) => {
        command += condition + " AND ";
      });

      command = command.substr(0, command.length - 5);
    }

    executeDBCommand(dbHandle, command)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * updates lobby in db with current state of lobby
 * @param {Pool} dbHandle bot database handle
 * @param {JSON} lobby lobby object
 */
export async function updateLobby(dbHandle: Pool, lobby: Lobby) {
  return updateTableEntriesByConditions(
    dbHandle,
    "lobbies",
    ["data"],
    ["'" + JSON.stringify(lobby) + "'"],
    getLobbyConditions(lobby.channelId, lobby.messageId)
  );
}

/**
 * updates schedule in db with current state of schedule
 * @param {Pool} dbHandle bot database handle
 * @param {s.Schedule} schedule schedule object
 */
export async function updateSchedule(dbHandle: Pool, schedule: Schedule) {
  return updateTableEntriesByConditions(
    dbHandle,
    "schedules",
    ["data"],
    ["'" + JSON.stringify(schedule) + "'"],
    getScheduleConditions(schedule.messageId, schedule.emoji)
  );
}

/**
 * updates current day in DB
 * @param {Pool} dbHandle bot database handle
 * @param {number} day current day of the week (0=sun, 1=mon, ...)
 */
export async function updateDay(dbHandle: Pool, day: number) {
  return updateTableEntriesByConditions(
    dbHandle,
    "options",
    ["value"],
    ["" + day],
    ["name = 'day'"]
  );
}

/**
 * updates coach in db
 * @param {Pool} dbHandle bot database handle
 * @param {Coach} coach coach
 */
export async function updateCoach(dbHandle: Pool, coach: Coach) {
  return updateTableEntriesByConditions(
    dbHandle,
    "coaches",
    [
      "lobbyCount",
      "lobbyCountTryout",
      "lobbyCountNormal",
      "lobbyCountReplayAnalysis",
    ],
    [
      coach.lobbyCount,
      coach.lobbyCountTryout,
      coach.lobbyCountNormal,
      coach.lobbyCountReplayAnalysis,
    ],
    ["userId = '" + coach.userId + "'"]
  );
}

/**
 * updates player in db
 * @param {Pool} dbHandle bot database handle
 * @param {p.Player} player player
 */
export async function updatePlayer(dbHandle: Pool, player: Player) {
  return updateTableEntriesByConditions(
    dbHandle,
    "players",
    [
      "referredBy",
      "referralLock",
      "lobbyCount",
      "lobbyCountUnranked",
      "lobbyCountBotBash",
      "lobbyCount5v5",
      "lobbyCountReplayAnalysis",
      "offenses",
    ],
    [
      '"' + player.referredBy + '"',
      player.referralLock,
      player.lobbyCount,
      player.lobbyCountUnranked,
      player.lobbyCountBotBash,
      player.lobbyCount5v5,
      player.lobbyCountReplayAnalysis,
      player.offenses,
    ],
    ["userId = '" + player.userId + "'"]
  );
}

/**
 * updates referrer in db
 * @param {Pool} dbHandle bot database handle
 * @param {r.Referrer} referrer referrer
 */
export async function updateReferrer(dbHandle: Pool, referrer: Referrer) {
  return updateTableEntriesByConditions(
    dbHandle,
    "referrers",
    ["userId", "referralCount"],
    [
      referrer.userId === "" ? "'Unknown'" : referrer.userId,
      referrer.referralCount,
    ],
    ["tag = '" + referrer.tag + "'"]
  );
}

/**
 * Compiles input to mysql command and resolves the database answer as the result
 * @param {Pool} dbHandle
 * @param {string} table
 * @param {string} column
 * @param {Array<String>} conditions
 */
async function selectTableValueByConditions(
  dbHandle: Pool,
  table: string,
  column: string,
  conditions: Array<string>
) {
  return new Promise<
    [
      (
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket
        | OkPacket[]
        | ResultSetHeader
      ),
      FieldPacket[]
    ]
  >(function (resolve, reject) {
    var command = "SELECT " + column + " FROM " + table;

    if (conditions.length > 0) {
      command += " WHERE ";
      conditions.forEach((condition) => {
        command += condition + " AND ";
      });

      command = command.substr(0, command.length - 5);
    }

    executeDBCommand(dbHandle, command)
      .then(
        (
          res: [
            (
              | RowDataPacket[]
              | RowDataPacket[][]
              | OkPacket
              | OkPacket[]
              | ResultSetHeader
            ),
            FieldPacket[]
          ]
        ) => {
          resolve(res);
        }
      )
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Creates array of conditions for schedule
 * @param {string} message_id
 * @param {string} emoji
 */
function getScheduleConditions(message_id: string, emoji: string) {
  var conditions = [];
  if (message_id !== "") conditions.push("message_id = '" + message_id + "'");
  if (emoji !== "") conditions.push("emoji = '" + emoji + "'");
  return conditions;
}

/**
 * creates array of conditions for lobby
 * @param {string} channelId
 * @param {string} messageId
 */
function getLobbyConditions(channelId: string, messageId: string) {
  var conditions = [];
  if (channelId !== "") conditions.push("channel_id = '" + channelId + "'");
  if (messageId !== "") conditions.push("message_id = '" + messageId + "'");
  return conditions;
}

function hasData(
  response: RowDataPacket | RowDataPacket[] | OkPacket
): response is RowDataPacket {
  if ("data" in response) {
    return true;
  }
  return false;
}

/**
 * returns all lobbies given channel and message id
 * @param {Pool} dbHandle
 * @param {string} channelId
 * @param {string} messageId
 */
export async function getLobbies(
  dbHandle: Pool,
  channelId: string = "",
  messageId: string = ""
) {
  return new Promise<Lobby[]>(function (resolve) {
    selectTableValueByConditions(
      dbHandle,
      "lobbies",
      "data",
      getLobbyConditions(channelId, messageId)
    ).then((dB_response) => {
      resolve(
        getTypedArrayFromDBResponseWithJSONData<Lobby>(dB_response, Lobby)
      );
    });
  });
}

/**
 * Returns all schedules fitting given message id and emoji
 * @param {Pool} dbHandle
 * @param {string} message_id
 * @param {string} emoji
 */
export async function getSchedules(
  dbHandle: Pool,
  message_id: string = "",
  emoji: string = ""
) {
  return new Promise<Schedule[]>(function (resolve) {
    selectTableValueByConditions(
      dbHandle,
      "schedules",
      "data",
      getScheduleConditions(message_id, emoji)
    ).then((dB_response) => {
      resolve(
        getTypedArrayFromDBResponseWithJSONData<Schedule>(dB_response, Schedule)
      );
    });
  });
}

function hasValue(
  response: RowDataPacket | RowDataPacket[] | OkPacket
): response is RowDataPacket {
  if ("value" in response) {
    return true;
  }
  return false;
}

/**
 * returns day from options-table in database
 * @param {Pool} dbHandle
 */
export async function getDay(dbHandle: Pool) {
  return new Promise<number>(function (resolve, reject) {
    selectTableValueByConditions(dbHandle, "options", "value", [
      "name = 'day'",
    ]).then((dB_response) => {
      if (
        !Array.isArray(dB_response[0]) ||
        dB_response[0].length === 0 ||
        !hasValue(dB_response[0][0])
      )
        resolve(NaN);
      else {
        resolve(parseInt(dB_response[0][0].value));
      }
    });
  });
}

type Constructor<T> = new (...args: any[]) => T;

const input2Instance = <T>(
  source: any,
  destinationConstructor: Constructor<T>
): T => Object.assign(new destinationConstructor(), source);

function getTypedArrayFromDBResponse<T>(
  res: [
    (
      | OkPacket
      | ResultSetHeader
      | RowDataPacket[]
      | RowDataPacket[][]
      | OkPacket[]
    ),
    FieldPacket[]
  ],
  type: Constructor<T>
): Array<T> {
  var rawData = res[0];
  var typedArray: Array<T> = [];

  if (Array.isArray(rawData) && rawData.length > 0) {
    rawData.forEach((data: any) => {
      const typedDatum = input2Instance<T>(data, type);
      if (typedDatum !== undefined) typedArray.push(typedDatum);
    });
  }
  return typedArray;
}

function getTypedArrayFromDBResponseWithJSONData<T>(
  res: [
    (
      | OkPacket
      | ResultSetHeader
      | RowDataPacket[]
      | RowDataPacket[][]
      | OkPacket[]
    ),
    FieldPacket[]
  ],
  type: Constructor<T>
): Array<T> {
  var rawData = res[0];
  var typedArray: Array<T> = [];

  if (Array.isArray(rawData) && rawData.length > 0) {
    rawData.forEach((data: any) => {
      const typedDatum = input2Instance<T>(data.data, type);
      if (typedDatum !== undefined) typedArray.push(typedDatum);
    });
  }
  return typedArray;
}

/**
 * Returns all players in DB sorted by specific column
 * @param {Pool} dbHandle
 * @param {string} columnName name of column to sort by
 */
export async function getSortedPlayers(
  dbHandle: Pool,
  columnName = "lobbyCount"
) {
  return new Promise<Array<Player>>(function (resolve, reject) {
    var command = getSortedTableCommand("players", columnName);

    executeDBCommand(dbHandle, command)
      .then((res) => {
        resolve(getTypedArrayFromDBResponse<Player>(res, Player));
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Returns all referrers in DB sorted by specific column
 * @param {Pool} dbHandle
 * @param {string} columnName name of column to sort by
 */
export async function getSortedReferrers(
  dbHandle: Pool,
  columnName = "referralCount"
) {
  return new Promise<Referrer[]>(function (resolve, reject) {
    var command = getSortedTableCommand("referrers", columnName);

    executeDBCommand(dbHandle, command)
      .then((res) => {
        resolve(getTypedArrayFromDBResponse<Referrer>(res, Referrer));
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Returns all coaches in DB sorted by specific column
 * @param {Pool} dbHandle
 * @param {string} columnName name of column to sort by
 */
export async function getSortedCoaches(
  dbHandle: Pool,
  columnName = "lobbyCount"
) {
  return new Promise<Array<Coach>>(function (resolve, reject) {
    var command = getSortedTableCommand("coaches", columnName);

    executeDBCommand(dbHandle, command)
      .then((res) => {
        resolve(getTypedArrayFromDBResponse<Coach>(res, Coach));
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Returns coach given user ID, returns empty coach if it didnt find one
 * @param {Pool} dbHandle
 * @param {string} userId
 */
export async function getCoach(dbHandle: Pool, userId = "") {
  return new Promise<Coach | undefined>(function (resolve, reject) {
    selectTableValueByConditions(
      dbHandle,
      "coaches",
      "userId, lobbyCount, lobbyCountTryout, lobbyCountNormal, lobbyCountReplayAnalysis",
      ["userId = '" + userId + "'"]
    ).then((dB_response) => {
      var coachArray = getTypedArrayFromDBResponse<Coach>(dB_response, Coach);
      resolve(coachArray.length > 0 ? coachArray[0] : undefined);
    });
  });
}

export async function getPlayerByID(dbHandle: Pool, userId = "") {
  return getPlayer(dbHandle, ["userId = '" + userId + "'"]);
}

export async function getPlayerByTag(dbHandle: Pool, tag = "") {
  return getPlayer(dbHandle, ["tag = '" + tag + "'"]);
}

async function getPlayer(dbHandle: Pool, filter: string[]) {
  return new Promise<Player | undefined>(function (resolve, reject) {
    selectTableValueByConditions(
      dbHandle,
      "players",
      "userId, tag, referredBy, referralLock, lobbyCount, lobbyCountUnranked, lobbyCountBotBash, lobbyCount5v5, lobbyCountReplayAnalysis, offenses",
      filter
    ).then((dB_response) => {
      var playerArray = getTypedArrayFromDBResponse<Player>(
        dB_response,
        Player
      );
      resolve(playerArray.length > 0 ? playerArray[0] : undefined);
    });
  });
}

export async function getReferrerByID(dbHandle: Pool, userId = "") {
  return getReferrer(dbHandle, ["userId = '" + userId + "'"]);
}

export async function getReferrerByTag(dbHandle: Pool, tag = "") {
  return getReferrer(dbHandle, ["tag = '" + tag + "'"]);
}

async function getReferrer(dbHandle: Pool, filter: string[]) {
  return new Promise<Referrer | undefined>(function (resolve) {
    selectTableValueByConditions(
      dbHandle,
      "referrers",
      "userId, tag, referralCount",
      filter
    ).then((dB_response) => {
      var referrerArray = getTypedArrayFromDBResponse<Referrer>(
        dB_response,
        Referrer
      );
      resolve(referrerArray.length > 0 ? referrerArray[0] : undefined);
    });
  });
}

/**
 * Deletes table rows in given table according to the laid out conditions
 * @param {Pool} dbHandle bot database handle
 * @param {string} table table name
 * @param {Array<String>} conditions array of strings containing the conditions (will be combined with 'AND')
 */
async function deleteTableRows(
  dbHandle: Pool,
  table: string,
  where: String,
  tableRows: String
) {
  return new Promise<
    [
      (
        | OkPacket
        | ResultSetHeader
        | RowDataPacket[]
        | RowDataPacket[][]
        | OkPacket[]
      ),
      FieldPacket[]
    ]
  >(function (resolve, reject) {
    var command = `DELETE FROM ${table} ${
      where !== "" ? `WHERE ${where}` : ""
    } ${tableRows !== "" ? `IN ${tableRows}` : ""}`;
    executeDBCommand(dbHandle, command)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function concatStrings(
  strings: Array<string>,
  sep: string,
  surOpen: string,
  surClose: string
) {
  var res: string = "";
  if (strings.length > 0) {
    res += surOpen;
    strings.forEach((string) => {
      res += string + sep;
    });
    res = res.substr(0, res.length - sep.length);
    res += surClose;
  }
  return res;
}

/**
 * Deletes table rows in given table according to the laid out conditions
 * @param {Pool} dbHandle bot database handle
 * @param {string} table table name
 * @param {Array<string>} conditions array of strings containing the conditions (will be combined with 'AND')
 */
async function deleteSomeUniqueTableRows(
  dbHandle: Pool,
  table: string,
  columns: Array<string>,
  values: Array<string>
) {
  const where = concatStrings(columns, ",", "(", ")"),
    tableRows = concatStrings(values, ",", "(", ")");

  return deleteTableRows(dbHandle, table, where, tableRows);
}

/**
 * Deletes table rows in given table according to the laid out conditions
 * @param {Pool} dbHandle bot database handle
 * @param {string} table table name
 * @param {Array<String>} conditions array of strings containing the conditions (will be combined with 'AND')
 */
async function deleteFromAllTableRows(
  dbHandle: Pool,
  table: string,
  conditions: Array<string>
) {
  const where = concatStrings(conditions, " AND ", "", ""),
    tableRows = "";

  deleteTableRows(dbHandle, table, where, tableRows);
}

/**
 * Remove lobby from database
 * @param {Pool} dbHandle
 * @param {Lobby} lobby
 */
export async function removeLobby(dbHandle: Pool, lobby: Lobby) {
  return deleteFromAllTableRows(
    dbHandle,
    "lobbies",
    getLobbyConditions(lobby.channelId, lobby.messageId)
  );
}

/**
 * Remove all schedules belonging to a message-ID
 * @param {Pool} dbHandle
 * @param {Array<Schedule>} messageIDs
 */
export async function removeSchedules(
  dbHandle: Pool,
  schedules: Array<Schedule>
) {
  const columns = ["emoji", "message_id"];
  var values: Array<string> = [];
  schedules.forEach((schedule) => {
    values.push(`(${schedule.emoji},${schedule.messageId})`);
  });
  return deleteSomeUniqueTableRows(dbHandle, "schedules", columns, values);
}

export function createDBHandle() {
  console.log(
    `trying to connect to MYSQL-DB on \nhost ${process.env.MYSQL_HOST}\nuser ${process.env.MYSQL_USER}\npw ${process.env.MYSQL_PASSWORD}\ndb ${process.env.MYSQL_DATABASE}\n`
  );

  return createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}
