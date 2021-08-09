import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { RowDataPacket } from "mysql2/promise";
import { IColumnsAndValues } from "../database/interfaces/ColumnsAndValues";

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

  public insert(serializable: T): void {
    const dbValues = this.getSerializeValues(serializable);
    const dbData = this.generateDBData(dbValues);
    this.settings.dbClient.insertRow(this.settings.table, dbData);
  }

  public get(): Promise<T[]> {
    return new Promise<T[]>(this.getExecutor);
  }

  public getSorted(sortColumn: string = ""): Promise<T[]> {
    if (sortColumn.length > 0) this.settings.sortColumn = sortColumn;
    return new Promise<T[]>(this.getSortedExecutor);
  }

  public update(serializable: T): void {
    const dbValues = this.getSerializeValues(serializable);
    const dbData = this.generateDBData(dbValues);
    this.settings.dbClient.updateRows(
      this.settings.table,
      dbData,
      this.getSerializableCondition(serializable)
    );
  }

  public delete(serializables: T[]): void {
    this.settings.dbClient.deleteRows(
      this.settings.table,
      this.getDeletionIdentifierColumns(),
      this.getSerializableDeletionValues(serializables)
    );
  }

  private getExecutor(
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

  private getSortedExecutor(
    resolve: (value: T[] | PromiseLike<T[]>) => void,
    _reject: (reason?: any) => void
  ): void {
    this.settings.dbClient.getSortedTable(
      this.settings.table,
      this.settings.sortColumn,
      (res: RowDataPacket[]) => {
        resolve(this.getTypeArrayFromSQLResponse(res));
      }
    );
  }

  private generateDBData(values: string[]): IColumnsAndValues[] {
    return this.settings.columns.map((col, idx) => {
      return {
        columnName: col,
        value: values[idx],
      };
    });
  }

  protected abstract getTypeArrayFromSQLResponse(
    response: RowDataPacket[]
  ): T[];
  protected abstract getSerializableCondition(serializable: T): string[];
  protected abstract getCondition(): string[];
  protected abstract getSerializeValues(serializable: T): string[];
  protected abstract getDeletionIdentifierColumns(): string[];
  protected abstract getSerializableDeletionValues(
    serializables: T[]
  ): string[];
}
