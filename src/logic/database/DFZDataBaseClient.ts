import { createPool, Pool, RowDataPacket } from "mysql2/promise";
import { IColumnsAndValues } from "./interfaces/ColumnsAndValues";

export class DFZDataBaseClient {
  pool: Pool;

  constructor() {
    this.pool = DFZDataBaseClient.createDataBaseHandle();
  }

  private static createDataBaseHandle() {
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

  private static fixSqlCommand(command: string) {
    return command
      .replace(/[\\]/g, "\\\\")
      .replace(/[\/]/g, "\\/")
      .replace(/[\b]/g, "\\b")
      .replace(/[\f]/g, "\\f")
      .replace(/[\n]/g, "\\n")
      .replace(/[\r]/g, "\\r")
      .replace(/[\t]/g, "\\t");
  }

  private static composeInsertRowCommand(
    table: string,
    values: IColumnsAndValues[]
  ) {
    const valueNames = values.map((v) => v.columnName).join(", ");
    const valueValues = values.map((v) => v.value).join("', '");
    return `INSERT INTO ${table}(${valueNames}) VALUES('${valueValues}');`;
  }

  private static composeSelectRowsCommand(
    table: string,
    columns: string[],
    conditions: string[]
  ) {
    let conditionsString = "";
    if (conditions.length > 0)
      conditionsString = `WHERE ${conditions.join(" AND ")}`;

    return `SELECT ${columns.join(", ")} FROM ${table} ${conditionsString}`;
  }

  private static composeDeleteRowsCommand(
    table: string,
    where: string[],
    which: string[]
  ) {
    const whereString = where.length !== 0 ? `WHERE (${where.join(",")})` : "";
    const whichString = which.length !== 0 ? `IN ((${which.join("),(")}))` : "";
    return `DELETE FROM ${table} ${whereString} ${whichString}`;
  }

  private static composeSortedTableCommand(
    tableName: string,
    columnName: string
  ) {
    return `SELECT * FROM ${tableName} ${
      columnName !== "" ? `ORDER BY ${columnName} DESC` : ""
    }`;
  }

  private static getUpdateValues(update: IColumnsAndValues[]) {
    const updateValues: string[] = [];
    for (const updateEntry of update) {
      updateValues.push(`${updateEntry.columnName}='${updateEntry.value}'`);
    }
    return updateValues.join(", ");
  }

  private static getConditionValues(conditions: string[]) {
    return conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  }

  private static composeUpdateTableCommand(
    table: string,
    update: IColumnsAndValues[],
    conditions: string[]
  ) {
    let command = `Update ${table} SET `;
    command += DFZDataBaseClient.getUpdateValues(update);
    command += DFZDataBaseClient.getConditionValues(conditions);
    return command;
  }

  public insertRow(table: string, values: IColumnsAndValues[]) {
    const command = DFZDataBaseClient.composeInsertRowCommand(table, values);
    return this.executeSQLCommand(command);
  }

  public selectRows(
    table: string,
    columns: string[],
    conditions: string[],
    callback: (res: RowDataPacket[]) => void
  ) {
    const command = DFZDataBaseClient.composeSelectRowsCommand(
      table,
      columns,
      conditions
    );
    this.executeSQLCommand(command, callback);
  }

  public updateRows(
    table: string,
    update: IColumnsAndValues[],
    conditions: string[]
  ) {
    const command = DFZDataBaseClient.composeUpdateTableCommand(
      table,
      update,
      conditions
    );
    this.executeSQLCommand(command);
  }

  public deleteRows(table: string, where: string[], which: string[]) {
    const command = DFZDataBaseClient.composeDeleteRowsCommand(
      table,
      where,
      which
    );
    this.executeSQLCommand(command);
  }

  public getSortedTable(
    table: string,
    column: string,
    callback: (res: RowDataPacket[]) => void
  ) {
    const command = DFZDataBaseClient.composeSortedTableCommand(table, column);
    this.executeSQLCommand(command, callback);
  }

  private executeSQLCommand(
    command: string,
    callback: (res: RowDataPacket[]) => void = () => {}
  ) {
    const fixedCommand = DFZDataBaseClient.fixSqlCommand(command);
    this.pool.execute<RowDataPacket[]>(fixedCommand).then((result) => {
      callback(result[0]);
    });
  }
}
