import {
  ColumnsAndValues,
  DFZDataBaseClient,
  SQLReturnValue,
} from "../database/DFZDataBaseClient";

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
      this.getSerializableCondition()
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
    reject: (reason?: any) => void
  ): void {
    this.settings.dbClient.selectRows(
      this.settings.table,
      this.settings.columns,
      this.getSerializableCondition(),
      (res: SQLReturnValue) => {
        const array = this.getTypeArrayFromSQLResponse(res);
        if (array.length === 0)
          reject("could not retrieve coach from data base");
        resolve(array);
      }
    );
  }

  getSortedExecutor(
    resolve: (value: T[] | PromiseLike<T[]>) => void,
    reject: (reason?: any) => void
  ): void {
    this.settings.dbClient.getSortedTable(
      this.settings.table,
      this.settings.sortColumn,
      (res: SQLReturnValue) => {
        const array = this.getTypeArrayFromSQLResponse(res);
        if (array.length === 0)
          reject("could not retrieve coach from data base");
        resolve(array);
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

  abstract getTypeArrayFromSQLResponse(response: SQLReturnValue): T[];
  abstract getSerializableCondition(): string[];
  abstract getSerializeValues(serializable: T): string[];
  abstract getDeletionIdentifierColumns(): string[];
  abstract getSerializableDeletionValues(serializables: T[]): string[];
}
