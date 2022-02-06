import {createPool, Pool, RowDataPacket} from "mysql2/promise";
import {IColumnsAndValues} from "./interfaces/ColumnsAndValues";

export class DFZDataBaseClient {
    pool: Pool;

    constructor() {
        this.pool = this.createDataBaseHandle();
    }

    public insertRow(table: string, values: IColumnsAndValues[]) {
        const command = this.composeInsertRowCommand(table, values);
        return this.executeSQLCommand(command);
    }

    public selectRows(
        table: string,
        columns: string[],
        conditions: string[],
        callback: (res: RowDataPacket[]) => void
    ) {
        const command = this.composeSelectRowsCommand(table, columns, conditions);
        this.executeSQLCommand(command, callback);
    }

    public updateRows(
        table: string,
        update: IColumnsAndValues[],
        conditions: string[]
    ) {
        const command = this.composeUpdateTableCommand(table, update, conditions);
        this.executeSQLCommand(command);
    }

    public deleteRows(table: string, where: string[], which: string[]) {
        const command = this.composeDeleteRowsCommand(table, where, which);
        this.executeSQLCommand(command);
    }

    public getSortedTable(
        table: string,
        column: string,
        callback: (res: RowDataPacket[]) => void
    ) {
        const command = this.composeSortedTableCommand(table, column);
        this.executeSQLCommand(command, callback);
    }

    private createDataBaseHandle() {
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

    private executeSQLCommand(
        command: string,
        callback: (res: RowDataPacket[]) => void = () => {
        }
    ) {
        const fixedCommand = this.fixSqlCommand(command);
        this.pool.execute<RowDataPacket[]>(fixedCommand).then((result) => {
            callback(result[0]);
        });
    }

    private fixSqlCommand(command: string) {
        return command
            .replace(/[\\]/g, "\\\\")
            .replace(/[\/]/g, "\\/")
            .replace(/[\b]/g, "\\b")
            .replace(/[\f]/g, "\\f")
            .replace(/[\n]/g, "\\n")
            .replace(/[\r]/g, "\\r")
            .replace(/[\t]/g, "\\t");
    }

    private composeInsertRowCommand(table: string, values: IColumnsAndValues[]) {
        const valueNames = values.map((v) => v.columnName).join(", ");
        const valueValues = values.map((v) => v.value).join("', '");
        return `INSERT INTO ${table}(${valueNames}) VALUES('${valueValues}');`;
    }

    private composeSelectRowsCommand(
        table: string,
        columns: string[],
        conditions: string[]
    ) {
        var conditionsString = "";
        if (conditions.length > 0)
            conditionsString = `WHERE ${conditions.join(" AND ")}`;

        return `SELECT ${columns.join(", ")} FROM ${table} ${conditionsString}`;
    }

    private composeUpdateTableCommand(
        table: string,
        update: IColumnsAndValues[],
        conditions: string[]
    ) {
        var command = `Update ${table} SET `;
        command += this.getUpdateValues(update);
        command += this.getConditionValues(conditions);
        return command;
    }

    private composeDeleteRowsCommand(
        table: string,
        where: string[],
        which: string[]
    ) {
        const whereString = where.length !== 0 ? `WHERE (${where.join(",")})` : "";
        const whichString = which.length !== 0 ? `IN ((${which.join("),(")}))` : "";
        return `DELETE FROM ${table} ${whereString} ${whichString}`;
    }

    private composeSortedTableCommand(tableName: string, columnName: string) {
        return `SELECT * FROM ${tableName} ${
      columnName !== "" ? `ORDER BY ${columnName} DESC` : ""
    }`;
    }

    private getUpdateValues(update: IColumnsAndValues[]) {
        const updateValues: string[] = [];
        for (const updateEntry of update) {
            updateValues.push(`${updateEntry.columnName}='${updateEntry.value}'`);
        }
        return updateValues.join(", ");
    }

    private getConditionValues(conditions: string[]) {
        return conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
    }
}
