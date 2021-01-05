const mysql = require('mysql2/promise');
const s = require('./Schedule')

function getScheduleTableJson()
{
    return {   
        table_name: "schedules",
        table_columns: [
            {
                id:'emoji',
                type: 'VARCHAR(255)'
            },
            {
                id:'message_id',
                type: 'VARCHAR(255)'
            },
            {  
                id:'data',
                type: 'JSON'
            }
        ]
    };
}

function getLobbyTableJson()
{
    return {   
        table_name: "lobbies",
        table_columns: [
            {
                id:'channel_id',
                type: 'VARCHAR(255)'
            },
            {
                id:'message_id',
                type: 'VARCHAR(255)'
            },
            {  
                id:'data',
                type: 'JSON'
            }
        ]
    };
}

function getOptionsTableJson()
{
    return {   
        table_name: "options",
        table_columns: [
            {
                id:'name',
                type: 'VARCHAR(255)'
            },
            {
                id:'value',
                type: 'VARCHAR(255)'
            }
        ]
    };
}

function createScheduleTable(dbHandle)
{
    var json = getScheduleTableJson();
    return createTable(dbHandle, json.table_name, json.table_columns);
}

function createLobbyTable(dbHandle)
{
    var json = getLobbyTableJson();
    return createTable(dbHandle, json.table_name, json.table_columns);
}

function createOptionsTable(dbHandle)
{
    var json = getOptionsTableJson();
    return createTable(dbHandle, json.table_name, json.table_columns);
}

/**
 * Compiles table name and columns into a mysql-command
 * @param {string} table_name name of table 
 * @param {Array<String>} table_columns names of table columns
 */
function createCreateTableCommand(table_name, table_columns)
{
    var command = 'CREATE TABLE IF NOT EXISTS '+ table_name + ' (';
    command += (table_name + '_id INT AUTO_INCREMENT, ');
    table_columns.forEach(col => {
        command += col.id + ' ' + col.type + ', ';
    });
    command += 'INDEX(' + table_name + '_id)) ENGINE=INNODB;';
    return command;
}

/**
 * Creates new table in mysql-database
 * @param {mysql.Connection} dbHandle bot database handle
 * @param {string} table_name name of table 
 * @param {Array<String>} table_columns names of table columns
 */
async function createTable(dbHandle, table_name, table_columns)
{
    var command = createCreateTableCommand(table_name, table_columns);
    return dbHandle.execute(command);
}

/**
 * Executes insert command in mysql-db 
 * @param {mysql.Connection} dbHandle bot database handle
 * @param {string} table table id
 * @param {Array<String>} columnNames column IDs
 * @param {Array<String>} columnValues column values
 */
async function insertRow(dbHandle, table, columnNames, columnValues)
{
    var command = 'INSERT INTO ' + table + '( ' + columnNames.join(', ') + ') VALUES(\'' + columnValues.join('\', \'') + '\');';
    return dbHandle.execute(command);
}

/**
 * inserts lobby into database
 * @param {mysql.Connection} dbHandle bot database handle
 * @param {Array<String>} values values for channel_id, message_id and data
 */
async function insertLobbyRow(dbHandle, values)
{
    return insertRow(dbHandle, 'lobbies', ['channel_id', 'message_id', 'data'], values);
}

/**
 * inserts schedule into database
 * @param {mysql.Connection} dbHandle bot database handle
 * @param {Array<String>} values values for emoji, messageId and data
 */
async function insertScheduleRow(dbHandle, values)
{
    return insertRow(dbHandle, 'schedules', ['emoji', 'message_id', 'data'], values);
}

/**
 * Insert lobby into DB
 * @param {mysql.Connection} dbHandle 
 * @param {JSON} lobby
 */
async function insertLobby(dbHandle, lobby)
{
    values = [lobby.channelId, lobby.messageId, JSON.stringify(lobby)];
    return insertLobbyRow(dbHandle, values);
}

/**
 * Insert schedule into DB
 * @param {mysql.Connection} dbHandle 
 * @param {s.Schedule} schedule 
 */
async function insertSchedule(dbHandle, schedule)
{
    values = [schedule.emoji, schedule.messageId, JSON.stringify(schedule)];
    return insertScheduleRow(dbHandle, values);
}

/**
 * Setup function for day in options in database
 * @param {mysql.Connection} dbHandle bot database handle
 * @param {int} day day
 */
async function insertDay(dbHandle, day)
{
    return insertRow(dbHandle, 'options', ['name', 'value'], ['day', day]);
}

/**
 * updates a table with new values according to given conditions
 * @param {mysql.Connection} dbHandle bot database handle
 * @param {string} table table id
 * @param {string} column column id
 * @param {string} value new value
 * @param {Array<String>} conditions array of strings containing sql conditions
 */
async function updateTableEntryByConditions(dbHandle, table, column, value, conditions)
{
    var command = "Update " + table + " SET " + column + "=" + value;

    if(conditions.length > 0)
    {
        command += " WHERE ";
        conditions.forEach(condition =>
        {
            command += condition + " AND "; 
        });

        command = command.substr(0, command.length-5);
    }
    return dbHandle.execute(command);
}

/**
 * updates lobby in db with current state of lobby
 * @param {mysql.Connection} dbHandle bot database handle
 * @param {JSON} lobby lobby object
 */
async function updateLobby(dbHandle, lobby)
{
    return updateTableEntryByConditions(dbHandle, 'lobbies', 'data', '\''+JSON.stringify(lobby)+'\'', getLobbyConditions(lobby.channelId, lobby.messageId));
}

/**
 * updates schedule in db with current state of schedule
 * @param {mysql.Connection} dbHandle bot database handle
 * @param {s.Schedule} schedule schedule object
 */
async function updateSchedule(dbHandle, schedule)
{
    return updateTableEntryByConditions(dbHandle, 'schedules', 'data', '\''+JSON.stringify(schedule)+'\'', getScheduleConditions(schedule.messageId, schedule.emoji));
}

/**
 * updates current day in DB
 * @param {mysql.Connection} dbHandle bot database handle
 * @param {int} day current day of the week (0=sun, 1=mon, ...)
 */
async function updateDay(dbHandle, day)
{
    return updateTableEntryByConditions(dbHandle, 'options', 'value', day, ['name = \'day\'']);
}

/**
 * Compiles input to mysql command and resolves the database answer as the result
 * @param {mysql.Connection} dbHandle 
 * @param {string} table 
 * @param {string} column 
 * @param {Array<String>} conditions 
 */
async function selectTableValueByConditions(dbHandle, table, column, conditions)
{
    return new Promise(function(resolve, reject) {
            
        var command = "SELECT " + column + " FROM " + table;

        if(conditions.length > 0)
        {
            command += " WHERE ";
            conditions.forEach(condition =>
            {
                command += condition + " AND "; 
            });

            command = command.substr(0, command.length-5);
        }
        dbHandle.execute(command).then(res=>{
            resolve(res[0].length === 0 ? undefined : res[0]);
        });        
    });
}

/**
 * Creates array of conditions for schedule
 * @param {string} message_id 
 * @param {string} emoji 
 */
function getScheduleConditions(message_id, emoji)
{
    var conditions = [];
    if(message_id !== '')
        conditions.push('message_id = \''+ message_id+'\'');
    if(emoji !== '')
        conditions.push('emoji = \''+ emoji+'\'');
    return conditions;
}

/**
 * creates array of conditions for lobby
 * @param {string} channelId 
 * @param {string} messageId 
 */
function getLobbyConditions(channelId, messageId)
{
    var conditions = [];
    if(channelId !== '')
        conditions.push('channel_id = \''+ channelId+'\'');
    if(messageId !== '')
        conditions.push('message_id = \''+ messageId+'\'');
    return conditions;
}

/**
 * returns all lobbies given channel and message id
 * @param {mysql.Connection} dbHandle 
 * @param {string} channelId 
 * @param {string} messageId 
 */
async function getLobbies(dbHandle, channelId = '', messageId = '')
{
    return new Promise(function(resolve, reject) {
        selectTableValueByConditions(dbHandle, 'lobbies', 'data', getLobbyConditions(channelId, messageId))
        .then(dB_response =>{
            if(!Array.isArray(dB_response) || dB_response.length === 0)
                resolve([]);
            else
            {
                lobbies = [];
                dB_response.forEach(resp => lobbies.push(resp.data));
                resolve(lobbies);
            }
        })
    });
}

/**
 * Returns all schedules fitting given message id and emoji
 * @param {mysql.Connection} dbHandle 
 * @param {string} message_id 
 * @param {string} emoji 
 */
async function getSchedules(dbHandle, message_id = '', emoji = '')
{
    return new Promise(function(resolve, reject) {
        selectTableValueByConditions(dbHandle, 'schedules', 'data', getScheduleConditions(message_id, emoji))
        .then(dB_response =>{
            if(!Array.isArray(dB_response) || dB_response.length === 0)
                resolve([]);
            else
            {
                schedules = [];
                dB_response.forEach(resp => schedules.push(s.Schedule.fromObject(resp.data)));
                resolve(schedules);
            }
        })
    });
}

/**
 * returns day from options-table in database
 * @param {mysql.Connection} dbHandle 
 */
async function getDay(dbHandle)
{
    return new Promise(function(resolve, reject) {
        selectTableValueByConditions(dbHandle, 'options', 'value', ['name = \'day\''])
        .then(dB_response =>{
            if(!Array.isArray(dB_response) || dB_response.length === 0)
                resolve(NaN);
            else
                resolve(parseInt(dB_response[0].value));
        })
    });
}

/**
 * Deletes table rows in given table according to the laid out conditions
 * @param {mysql.Connection} dbHandle bot database handle
 * @param {string} table table name 
 * @param {Array<String>} conditions array of strings containing the conditions (will be combined with 'AND')
 */
async function deleteTableRows(dbHandle, table, conditions)
{
    return new Promise(function(resolve, reject) {
        var command = "DELETE FROM " + table;

        if(conditions.length > 0)
        {
            command += " WHERE ";
            conditions.forEach(condition =>
            {
                command += condition + " AND "; 
            });

            command = command.substr(0, command.length-5);
        }
        dbHandle.execute(command).then(res=>{
            resolve(res);
        });
    });
}

/**
 * Remove lobby from database
 * @param {mysql.Connection} dbHandle 
 * @param {JSON} lobby 
 */
async function removeLobby(dbHandle, lobby)
{
    return deleteTableRows(dbHandle, 'lobbies', getLobbyConditions(lobby.channelId, lobby.messageId))
}

/**
 * Remove all schedules belonging to a message-ID
 * @param {mysql.Connection} dbHandle 
 * @param {Array<String>} messageIDs 
 */
async function removeSchedules(dbHandle, messageIDs)
{
    var conditions = ['message_id = \''+ messageIDs.join("\' OR message_id = \'") + '\''];
    return deleteTableRows(dbHandle, 'schedules', conditions);
}

module.exports = {
    /**
     * Connect to mysql-db
     */
    getDBHandle: function() {
        return mysql.createConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });
    },

    createScheduleTable:createScheduleTable,
    createLobbyTable:createLobbyTable,
    createOptionsTable:createOptionsTable,
    insertLobby:insertLobby,
    insertSchedule:insertSchedule,
    insertDay:insertDay,
    updateLobby:updateLobby,
    updateSchedule:updateSchedule,
    updateDay:updateDay,
    getLobbies:getLobbies,
    getSchedules:getSchedules,
    getDay:getDay,
    removeLobby:removeLobby,
    removeSchedules:removeSchedules
};