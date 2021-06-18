import {
  ColumnsAndValues,
  DFZDataBaseClient,
} from "../database/DFZDataBaseClient";
import { RowDataPacket } from "mysql2/promise";

export interface SerializationSettings {
  dbClient: DFZDataBaseClient;
  table: string;
  columns: string[];
  sortColumn: string;
}

export abstract class Serializer<T> {
  settings: SerializationSettings;

  constructor(settings: SerializationSettings) {
    this.settings = settings;

    this.getExecutor = this.getExecutor.bind(this);
    this.getTypeArrayFromSQLResponse =
      this.getTypeArrayFromSQLResponse.bind(this);
    this.getSerializableCondition = this.getSerializableCondition.bind(this);
    this.getSortedExecutor = this.getSortedExecutor.bind(this);
  }

  insert(serializable: T): void {
    const dbValues = this.getSerializeValues(serializable);
    const dbData = this.generateDBData(dbValues);
    this.settings.dbClient.insertRow(this.settings.table, dbData);
  }

  get(): Promise<T[]> {
    return new Promise<T[]>(this.getExecutor);
  }

  getSorted(sortColumn: string = ""): Promise<T[]> {
    if (sortColumn.length > 0) this.settings.sortColumn = sortColumn;
    return new Promise<T[]>(this.getSortedExecutor);
  }

  update(serializable: T): void {
    const dbValues = this.getSerializeValues(serializable);
    const dbData = this.generateDBData(dbValues);
    this.settings.dbClient.updateRows(
      this.settings.table,
      dbData,
      this.getSerializableCondition(serializable)
    );
  }

  delete(serializables: T[]): void {
    this.settings.dbClient.deleteRows(
      this.settings.table,
      this.getDeletionIdentifierColumns(),
      this.getSerializableDeletionValues(serializables)
    );
  }

  getExecutor(
    resolve: (value: T[] | PromiseLike<T[]>) => void,
    _reject: (reason?: any) => void
  ): void {
    this.settings.dbClient.selectRows(
      this.settings.table,
      this.settings.columns,
      this.getCondition(),
      (res: RowDataPacket[]) => {
        resolve(this.getTypeArrayFromSQLResponse(res));
      }
    );
  }

  getSortedExecutor(
    resolve: (value: T[] | PromiseLike<T[]>) => void,
    _reject: (reason?: any) => void
  ): void {
    this.settings.dbClient.getSortedTable(
      this.settings.table,
      this.settings.sortColumn,
      (res: RowDataPacket[]) => {
        console.log("Sorted executor: " + res.length + "rows.");

        resolve(this.getTypeArrayFromSQLResponse(res));
      }
    );
  }

  generateDBData(values: string[]): ColumnsAndValues[] {
    return this.settings.columns.map((col, idx) => {
      return {
        columnName: col,
        value: values[idx],
      };
    });
  }

  abstract getTypeArrayFromSQLResponse(response: RowDataPacket[]): T[];
  abstract getSerializableCondition(serializable: T): string[];
  abstract getCondition(): string[];
  abstract getSerializeValues(serializable: T): string[];
  abstract getDeletionIdentifierColumns(): string[];
  abstract getSerializableDeletionValues(serializables: T[]): string[];
}
