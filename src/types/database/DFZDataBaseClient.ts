import { createPool, Pool, RowDataPacket } from "mysql2/promise";
import { SQLTableCreator } from "./SQLTableCreator";

export class DFZDataBaseClient {
  pool: Pool;

  constructor() {
    this.pool = this.createDataBaseHandle();
  }

  createDataBaseHandle() {
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

  async tryCreateDataBaseTables() {
    try {
      this.createDataBaseTables();
    } catch (error) {
      console.log(`Failed creating database tables with error: ${error}`);
    }
  }

  async createDataBaseTables() {
    await SQLTableCreator.createScheduleTable(this.pool);
    await SQLTableCreator.createLobbyTable(this.pool);
    await SQLTableCreator.createOptionsTable(this.pool);
    await SQLTableCreator.createCoachTable(this.pool);
    await SQLTableCreator.createPlayerTable(this.pool);
    await SQLTableCreator.createReferrerTable(this.pool);
  }

  executeSQLCommand(
    command: string,
    callback: (res: RowDataPacket[]) => void = () => {}
  ) {
    const fixedCommand = fixSqlCommand(command);
    this.pool.execute<RowDataPacket[]>(fixedCommand).then((result) => {
      callback(result[0]);
    });
  }

  async insertRow(table: string, values: ColumnsAndValues[]) {
    const command = composeInsertRowCommand(table, values);
    return this.executeSQLCommand(command);
  }

  selectRows(
    table: string,
    columns: string[],
    conditions: string[],
    callback: (res: RowDataPacket[]) => void
  ) {
    const command = composeSelectRowsCommand(table, columns, conditions);
    this.executeSQLCommand(command, callback);
  }

  updateRows(table: string, update: ColumnsAndValues[], conditions: string[]) {
    const command = composeUpdateTableCommand(table, update, conditions);
    this.executeSQLCommand(command);
  }

  deleteRows(table: string, where: string[], which: string[]) {
    const command = composeDeleteRowsCommand(table, where, which);
    this.executeSQLCommand(command);
  }

  getSortedTable(
    table: string,
    column: string,
    callback: (res: RowDataPacket[]) => void
  ) {
    const command = composeSortedTableCommand(table, column);
    this.executeSQLCommand(command, callback);
  }
}

export interface ColumnsAndValues {
  columnName: string;
  value: string | number;
}

function composeInsertRowCommand(table: string, values: ColumnsAndValues[]) {
  const valueNames = values.map((v) => v.columnName).join(", ");
  const valueValues = values.map((v) => v.value).join("', '");
  return `INSERT INTO ${table}(${valueNames}) VALUES('${valueValues}');`;
}

function composeSelectRowsCommand(
  table: string,
  columns: string[],
  conditions: string[]
) {
  var conditionsString = "";
  if (conditions.length > 0)
    conditionsString = `WHERE ${conditions.join(" AND ")}`;

  return `SELECT ${columns.join(", ")} FROM ${table} ${conditionsString}`;
}

function composeDeleteRowsCommand(
  table: string,
  where: string[],
  which: string[]
) {
  const whereString = where.length !== 0 ? `WHERE (${where.join(",")})` : "";
  const whichString = which.length !== 0 ? `IN ((${which.join("),(")}))` : "";
  return `DELETE FROM ${table} ${whereString} ${whichString}`;
}

function composeUpdateTableCommand(
  table: string,
  update: ColumnsAndValues[],
  conditions: string[]
) {
  var command = `Update ${table} SET `;
  command += getUpdateValues(update);
  command += getConditionValues(conditions);
  return command;
}

function getUpdateValues(update: ColumnsAndValues[]) {
  const updateValues: string[] = [];
  for (const updateEntry of update) {
    updateValues.push(`${updateEntry.columnName}='${updateEntry.value}'`);
  }
  return updateValues.join(", ");
}

function getConditionValues(conditions: string[]) {
  return conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
}

function composeSortedTableCommand(tableName: string, columnName: string) {
  return `SELECT * FROM ${tableName} ${
    columnName !== "" ? `ORDER BY ${columnName} DESC` : ""
  }`;
}

function fixSqlCommand(command: string) {
  return command
    .replace(/[\\]/g, "\\\\")
    .replace(/[\/]/g, "\\/")
    .replace(/[\b]/g, "\\b")
    .replace(/[\f]/g, "\\f")
    .replace(/[\n]/g, "\\n")
    .replace(/[\r]/g, "\\r")
    .replace(/[\t]/g, "\\t");
}
