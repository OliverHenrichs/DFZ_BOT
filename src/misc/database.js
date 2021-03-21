"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const c = require("./types/coach");
const mysql = require("mysql2/promise");
const p = require("./types/player");
const r = require("./types/referrer");
const s = require("./types/schedule");
function getCoachTableJson() {
    return {
        table_name: "coaches",
        table_columns: [
            {
                id: "user_id",
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
function createPlayerTable(dbHandle) {
    var json = getPlayerTableJson();
    return createTable(dbHandle, json.table_name, json.table_columns);
}
function createReferrerTable(dbHandle) {
    var json = getReferrerTableJson();
    return createTable(dbHandle, json.table_name, json.table_columns);
}
function createCoachTable(dbHandle) {
    var json = getCoachTableJson();
    return createTable(dbHandle, json.table_name, json.table_columns);
}
function createScheduleTable(dbHandle) {
    var json = getScheduleTableJson();
    return createTable(dbHandle, json.table_name, json.table_columns);
}
function createLobbyTable(dbHandle) {
    var json = getLobbyTableJson();
    return createTable(dbHandle, json.table_name, json.table_columns);
}
function createOptionsTable(dbHandle) {
    var json = getOptionsTableJson();
    return createTable(dbHandle, json.table_name, json.table_columns);
}
/**
 * @param {string} tableName table to return
 * @param {string} column column to sort by
 * @returns sorted table
 */
function getSortedTableCommand(tableName, columnName) {
    //SELECT * FROM table_name ORDER BY column_name ASC|DESC
    return "SELECT * FROM " + tableName + " ORDER BY " + columnName + " DESC";
}
/**
 * Compiles table name and columns into a mysql-command
 * @param {string} table_name name of table
 * @param {Array<String>} table_columns names of table columns
 */
function createCreateTableCommand(table_name, table_columns) {
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
async function executeDBCommand(dbHandle, command) {
    return new Promise(function (resolve, reject) {
        dbHandle
            .execute(command)
            .then((res) => resolve(res))
            .catch((err) => {
            reject(err);
            console.log("Could not reconnect to MYSQL database. Reason: " + err);
        });
    });
}
/**
 * Creates new table in mysql-database
 * @param {Pool} dbHandle bot database handle
 * @param {string} table_name name of table
 * @param {Array<String>} table_columns names of table columns
 */
async function createTable(dbHandle, table_name, table_columns) {
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
async function insertRow(dbHandle, table, columnNames, columnValues) {
    var command = "INSERT INTO " +
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
async function insertCoachRow(dbHandle, values) {
    return insertRow(dbHandle, "coaches", [
        "user_id",
        "lobbyCount",
        "lobbyCountTryout",
        "lobbyCountNormal",
        "lobbyCountReplayAnalysis",
    ], values);
}
/**
 * inserts player into database
 * @param {Pool} dbHandle bot database handle
 * @param {(string | number)[]} values
 */
async function insertPlayerRow(dbHandle, values) {
    return insertRow(dbHandle, "players", [
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
    ], values);
}
/**
 * inserts player into database
 * @param {Pool} dbHandle bot database handle
 * @param {(string | number)[]} values
 */
async function insertReferrerRow(dbHandle, values) {
    return insertRow(dbHandle, "referrers", ["userId", "tag", "referralCount"], values);
}
/**
 * inserts lobby into database
 * @param {Pool} dbHandle bot database handle
 * @param {(string | number)[]} values values for channel_id, message_id and data
 */
async function insertLobbyRow(dbHandle, values) {
    return insertRow(dbHandle, "lobbies", ["channel_id", "message_id", "data"], values);
}
/**
 * inserts schedule into database
 * @param {Pool} dbHandle bot database handle
 * @param {(string | number)[]} values values for emoji, messageId and data
 */
async function insertScheduleRow(dbHandle, values) {
    return insertRow(dbHandle, "schedules", ["emoji", "message_id", "data"], values);
}
/**
 * Insert coach into DB
 * @param {Pool} dbHandle
 * @param {Coach} coach
 */
async function insertCoach(dbHandle, coach) {
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
async function insertPlayer(dbHandle, player) {
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
async function insertReferrer(dbHandle, referrer) {
    const values = [referrer.userId, referrer.tag, referrer.referralCount];
    return insertReferrerRow(dbHandle, values);
}
/**
 * Insert lobby into DB
 * @param {Pool} dbHandle
 * @param {Lobby} lobby
 */
async function insertLobby(dbHandle, lobby) {
    const values = [lobby.channelId, lobby.messageId, JSON.stringify(lobby)];
    return insertLobbyRow(dbHandle, values);
}
/**
 * Insert schedule into DB
 * @param {Pool} dbHandle
 * @param {Schedule} schedule
 */
async function insertSchedule(dbHandle, schedule) {
    const values = [schedule.emoji, schedule.messageId, JSON.stringify(schedule)];
    return insertScheduleRow(dbHandle, values);
}
/**
 * Setup function for day in options in database
 * @param {Pool} dbHandle bot database handle
 * @param {number} day day
 */
async function insertDay(dbHandle, day) {
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
async function updateTableEntriesByConditions(dbHandle, table, columns, values, conditions) {
    return new Promise(function (resolve, reject) {
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
async function updateLobby(dbHandle, lobby) {
    return updateTableEntriesByConditions(dbHandle, "lobbies", ["data"], ["'" + JSON.stringify(lobby) + "'"], getLobbyConditions(lobby.channelId, lobby.messageId));
}
/**
 * updates schedule in db with current state of schedule
 * @param {Pool} dbHandle bot database handle
 * @param {s.Schedule} schedule schedule object
 */
async function updateSchedule(dbHandle, schedule) {
    return updateTableEntriesByConditions(dbHandle, "schedules", ["data"], ["'" + JSON.stringify(schedule) + "'"], getScheduleConditions(schedule.messageId, schedule.emoji));
}
/**
 * updates current day in DB
 * @param {Pool} dbHandle bot database handle
 * @param {number} day current day of the week (0=sun, 1=mon, ...)
 */
async function updateDay(dbHandle, day) {
    return updateTableEntriesByConditions(dbHandle, "options", ["value"], ["" + day], ["name = 'day'"]);
}
/**
 * updates coach in db
 * @param {Pool} dbHandle bot database handle
 * @param {Coach} coach coach
 */
async function updateCoach(dbHandle, coach) {
    return updateTableEntriesByConditions(dbHandle, "coaches", [
        "lobbyCount",
        "lobbyCountTryout",
        "lobbyCountNormal",
        "lobbyCountReplayAnalysis",
    ], [
        coach.lobbyCount,
        coach.lobbyCountTryout,
        coach.lobbyCountNormal,
        coach.lobbyCountReplayAnalysis,
    ], ["user_id = '" + coach.userId + "'"]);
}
/**
 * updates player in db
 * @param {Pool} dbHandle bot database handle
 * @param {p.Player} player player
 */
async function updatePlayer(dbHandle, player) {
    return updateTableEntriesByConditions(dbHandle, "players", [
        "referredBy",
        "referralLock",
        "lobbyCount",
        "lobbyCountUnranked",
        "lobbyCountBotBash",
        "lobbyCount5v5",
        "lobbyCountReplayAnalysis",
        "offenses",
    ], [
        '"' + player.referredBy + '"',
        player.referralLock,
        player.lobbyCount,
        player.lobbyCountUnranked,
        player.lobbyCountBotBash,
        player.lobbyCount5v5,
        player.lobbyCountReplayAnalysis,
        player.offenses,
    ], ["userId = '" + player.userId + "'"]);
}
/**
 * updates referrer in db
 * @param {Pool} dbHandle bot database handle
 * @param {r.Referrer} referrer referrer
 */
async function updateReferrer(dbHandle, referrer) {
    return updateTableEntriesByConditions(dbHandle, "referrers", ["userId", "referralCount"], [referrer.userId, referrer.referralCount], ["tag = '" + referrer.tag + "'"]);
}
/**
 * Compiles input to mysql command and resolves the database answer as the result
 * @param {Pool} dbHandle
 * @param {string} table
 * @param {string} column
 * @param {Array<String>} conditions
 */
async function selectTableValueByConditions(dbHandle, table, column, conditions) {
    return new Promise(function (resolve, reject) {
        var command = "SELECT " + column + " FROM " + table;
        if (conditions.length > 0) {
            command += " WHERE ";
            conditions.forEach((condition) => {
                command += condition + " AND ";
            });
            command = command.substr(0, command.length - 5);
        }
        executeDBCommand(dbHandle, command)
            .then((res) => {
            let temp = res[0];
            resolve(temp.length === 0 ? undefined : temp);
        })
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
function getScheduleConditions(message_id, emoji) {
    var conditions = [];
    if (message_id !== "")
        conditions.push("message_id = '" + message_id + "'");
    if (emoji !== "")
        conditions.push("emoji = '" + emoji + "'");
    return conditions;
}
/**
 * creates array of conditions for lobby
 * @param {string} channelId
 * @param {string} messageId
 */
function getLobbyConditions(channelId, messageId) {
    var conditions = [];
    if (channelId !== "")
        conditions.push("channel_id = '" + channelId + "'");
    if (messageId !== "")
        conditions.push("message_id = '" + messageId + "'");
    return conditions;
}
function hasData(response) {
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
async function getLobbies(dbHandle, channelId = "", messageId = "") {
    return new Promise(function (resolve, reject) {
        selectTableValueByConditions(dbHandle, "lobbies", "data", getLobbyConditions(channelId, messageId)).then((dB_response) => {
            if (!Array.isArray(dB_response) || dB_response.length === 0)
                resolve([]);
            else {
                const lobbies = [];
                dB_response.forEach(function (resp) {
                    if (hasData(resp)) {
                        lobbies.push(resp.data);
                        return true;
                    }
                    return false;
                });
                resolve(lobbies);
            }
        });
    });
}
/**
 * Returns all schedules fitting given message id and emoji
 * @param {Pool} dbHandle
 * @param {string} message_id
 * @param {string} emoji
 */
async function getSchedules(dbHandle, message_id = "", emoji = "") {
    return new Promise(function (resolve, reject) {
        selectTableValueByConditions(dbHandle, "schedules", "data", getScheduleConditions(message_id, emoji)).then((dB_response) => {
            if (!Array.isArray(dB_response) || dB_response.length === 0)
                resolve([]);
            else {
                const schedules = [];
                dB_response.forEach(function (resp) {
                    if (hasData(resp)) {
                        var schedule = s.Schedule.fromObject(resp.data);
                        if (schedule !== undefined) {
                            schedules.push(schedule);
                        }
                    }
                });
                resolve(schedules);
            }
        });
    });
}
function hasValue(response) {
    if ("value" in response) {
        return true;
    }
    return false;
}
/**
 * returns day from options-table in database
 * @param {Pool} dbHandle
 */
async function getDay(dbHandle) {
    return new Promise(function (resolve, reject) {
        selectTableValueByConditions(dbHandle, "options", "value", [
            "name = 'day'",
        ]).then((dB_response) => {
            if (!Array.isArray(dB_response) ||
                dB_response.length === 0 ||
                !hasValue(dB_response[0]))
                resolve(NaN);
            else {
                resolve(parseInt(dB_response[0].value));
            }
        });
    });
}
/**
 * Returns all players in DB sorted by specific column
 * @param {Pool} dbHandle
 * @param {string} columnName name of column to sort by
 */
async function getSortedPlayers(dbHandle, columnName = "lobbyCount") {
    return new Promise(function (resolve, reject) {
        var command = getSortedTableCommand("players", columnName);
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
 * Returns all referrers in DB sorted by specific column
 * @param {Pool} dbHandle
 * @param {string} columnName name of column to sort by
 */
async function getSortedReferrers(dbHandle, columnName = "referralCount") {
    return new Promise(function (resolve, reject) {
        var command = getSortedTableCommand("referrers", columnName);
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
 * Returns all coaches in DB sorted by specific column
 * @param {Pool} dbHandle
 * @param {string} columnName name of column to sort by
 */
async function getSortedCoaches(dbHandle, columnName = "lobbyCount") {
    return new Promise(function (resolve, reject) {
        var command = getSortedTableCommand("coaches", columnName);
        executeDBCommand(dbHandle, command)
            .then((res) => {
            resolve(res);
        })
            .catch((err) => {
            reject(err);
        });
    });
}
function isCoach(response) {
    if ("lobbyCount" in response &&
        "lobbyCountTryout" in response &&
        "lobbyCountNormal" in response &&
        "lobbyCountReplayAnalysis" in response) {
        return true;
    }
    return false;
}
/**
 * Returns coach given user ID, resolves undefined if not found
 * @param {Pool} dbHandle
 * @param {string} userId
 */
async function getCoach(dbHandle, userId = "") {
    return new Promise(function (resolve, reject) {
        selectTableValueByConditions(dbHandle, "coaches", "lobbyCount, lobbyCountTryout, lobbyCountNormal, lobbyCountReplayAnalysis", ["user_id = '" + userId + "'"]).then((dB_response) => {
            if (!Array.isArray(dB_response) ||
                dB_response.length === 0 ||
                !isCoach(dB_response[0])) {
                resolve(undefined);
                return;
            }
            var c_content = dB_response[0];
            resolve(new c.Coach(userId, c_content.lobbyCount, c_content.lobbyCountTryout, c_content.lobbyCountNormal, c_content.lobbyCountReplayAnalysis));
        });
    });
}
async function getPlayerByID(dbHandle, userId = "") {
    return getPlayer(dbHandle, ["userId = '" + userId + "'"]);
}
async function getPlayerByTag(dbHandle, tag = "") {
    return getPlayer(dbHandle, ["tag = '" + tag + "'"]);
}
async function getPlayer(dbHandle, filter) {
    return new Promise(function (resolve, reject) {
        selectTableValueByConditions(dbHandle, "players", "userId, tag, referredBy, referralLock, lobbyCount, lobbyCountUnranked, lobbyCountBotBash, lobbyCount5v5, lobbyCountReplayAnalysis, offenses", filter).then((dB_response) => {
            if (!Array.isArray(dB_response) || dB_response.length === 0) {
                resolve(undefined);
                return;
            }
            resolve(p.Player.fromObject(dB_response[0]));
        });
    });
}
async function getReferrerByID(dbHandle, userId = "") {
    return getReferrer(dbHandle, ["userId = '" + userId + "'"]);
}
async function getReferrerByTag(dbHandle, tag = "") {
    return getReferrer(dbHandle, ["tag = '" + tag + "'"]);
}
async function getReferrer(dbHandle, filter) {
    return new Promise(function (resolve, reject) {
        selectTableValueByConditions(dbHandle, "referrers", "userId, tag, referralCount", filter).then((dB_response) => {
            if (!Array.isArray(dB_response) || dB_response.length === 0) {
                resolve(undefined);
                return;
            }
            resolve(r.Referrer.fromObject(dB_response[0]));
        });
    });
}
/**
 * Deletes table rows in given table according to the laid out conditions
 * @param {Pool} dbHandle bot database handle
 * @param {string} table table name
 * @param {Array<String>} conditions array of strings containing the conditions (will be combined with 'AND')
 */
async function deleteTableRows(dbHandle, table, conditions) {
    return new Promise(function (resolve, reject) {
        var command = "DELETE FROM " + table;
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
 * Remove lobby from database
 * @param {Pool} dbHandle
 * @param {Lobby} lobby
 */
async function removeLobby(dbHandle, lobby) {
    return deleteTableRows(dbHandle, "lobbies", getLobbyConditions(lobby.channelId, lobby.messageId));
}
/**
 * Remove all schedules belonging to a message-ID
 * @param {Pool} dbHandle
 * @param {Array<String>} messageIDs
 */
async function removeSchedules(dbHandle, messageIDs) {
    var conditions = [
        "message_id = '" + messageIDs.join("' OR message_id = '") + "'",
    ];
    return deleteTableRows(dbHandle, "schedules", conditions);
}
function createPool() {
    return mysql.createPool({
        host: "localhost",
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });
}
module.exports = {
    /**
     * @return {Pool}
     */
    createPool: createPool,
    createPlayerTable: createPlayerTable,
    createReferrerTable: createReferrerTable,
    createCoachTable: createCoachTable,
    createScheduleTable: createScheduleTable,
    createLobbyTable: createLobbyTable,
    createOptionsTable: createOptionsTable,
    insertCoach: insertCoach,
    insertPlayer: insertPlayer,
    insertReferrer: insertReferrer,
    insertLobby: insertLobby,
    insertSchedule: insertSchedule,
    insertDay: insertDay,
    updateLobby: updateLobby,
    updateSchedule: updateSchedule,
    updateDay: updateDay,
    updateCoach: updateCoach,
    updatePlayer: updatePlayer,
    updateReferrer: updateReferrer,
    getLobbies: getLobbies,
    getSchedules: getSchedules,
    getDay: getDay,
    getCoach: getCoach,
    getSortedCoaches: getSortedCoaches,
    getSortedPlayers: getSortedPlayers,
    getSortedReferrers: getSortedReferrers,
    getPlayerByID: getPlayerByID,
    getPlayerByTag: getPlayerByTag,
    getReferrerByID: getReferrerByID,
    getReferrerByTag: getReferrerByTag,
    removeLobby: removeLobby,
    removeSchedules: removeSchedules,
};
