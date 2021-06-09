import { OkPacket, Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { SQLTableCreator } from "./SQLTableCreator";
import { createDBHandle } from "../../misc/database";

export class DFZDataBaseClient {
  pool: Pool;

  constructor() {
    this.pool = createDBHandle();
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
    callback: (res: SQLReturnValue) => void = () => {}
  ) {
    const fixedCommand = fixSqlCommand(command);
    this.pool.execute(fixedCommand).then((result) => {
      callback({
        data: result[0],
      });
    });
  }

  async insertRow(table: string, values: ColumnsAndValues[]) {
    const command = composeInsertRowCommand(table, values);
    console.log(`insertRow: ${command}`);
    return this.executeSQLCommand(command);
  }

  selectRows(
    table: string,
    columns: string[],
    conditions: string[],
    callback: (res: SQLReturnValue) => void
  ) {
    const command = composeSelectRowsCommand(table, columns, conditions);
    console.log(`selectRows: ${command}`);

    this.executeSQLCommand(command, callback);
  }

  updateRows(table: string, update: ColumnsAndValues[], conditions: string[]) {
    const command = composeUpdateTableCommand(table, update, conditions);
    console.log(`updateRows: ${command}`);
    this.executeSQLCommand(command);
  }

  deleteRows(table: string, where: string[], which: string[]) {
    const command = composeDeleteRowsCommand(table, where, which);
    console.log(`deleteRows: ${command}`);
    this.executeSQLCommand(command);
  }

  getSortedTable(
    table: string,
    column: string,
    callback: (res: SQLReturnValue) => void
  ) {
    const command = composeSortedTableCommand(table, column);
    console.log(`getSortedTable: ${command}`);
    this.executeSQLCommand(command, callback);
  }
}

export interface SQLReturnValue {
  data:
    | RowDataPacket[]
    | RowDataPacket[][]
    | OkPacket
    | OkPacket[]
    | ResultSetHeader;
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

  const commandUpdates: string[] = [];
  for (const updateEntry of update) {
    commandUpdates.push(`${updateEntry.columnName}=${updateEntry.value}`);
  }
  command += commandUpdates.join(", ");

  if (conditions.length > 0) command += ` WHERE ${conditions.join(" AND ")}`;

  return command;
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

type Constructor<T> = new (...args: any[]) => T;

const input2Instance = <T>(
  source: any,
  destinationConstructor: Constructor<T>
): T => Object.assign(new destinationConstructor(), source);

export function getTypedArrayFromDBResponse<T>(
  res: SQLReturnValue,
  type: Constructor<T>
): Array<T> {
  var rawData = res.data;
  var typedArray: Array<T> = [];

  if (Array.isArray(rawData) && rawData.length > 0) {
    rawData.forEach((data: any) => {
      const typedDatum = input2Instance<T>(data, type);
      if (typedDatum !== undefined) typedArray.push(typedDatum);
    });
  }
  return typedArray;
}

export function getTypedArrayFromDBResponseWithJSONData<T>(
  res: SQLReturnValue,
  type: Constructor<T>
): Array<T> {
  var rawData = res.data;
  var typedArray: Array<T> = [];

  if (Array.isArray(rawData) && rawData.length > 0) {
    rawData.forEach((data: any) => {
      const typedDatum = input2Instance<T>(data.data, type);
      if (typedDatum !== undefined) typedArray.push(typedDatum);
    });
  }
  return typedArray;
}
