import { RowDataPacket } from "mysql2/promise";
import { IColumnsAndValues } from "../database/interfaces/ColumnsAndValues";
import { Serializable } from "../serializables/Serializable";
import { ISerializationSettings } from "./types/ISerializationSettings";
import { SerializerIds } from "./types/SerializerIds";

export abstract class Serializer<T extends Serializable> {
  settings: ISerializationSettings;

  constructor(settings: ISerializationSettings) {
    this.settings = settings;

    this.getExecutor = this.getExecutor.bind(this);
    this.getTypeArrayFromSQLResponse =
      this.getTypeArrayFromSQLResponse.bind(this);
    this.getSerializableCondition = this.getSerializableCondition.bind(this);
    this.getSortedExecutor = this.getSortedExecutor.bind(this);
  }

  public insert(serializable: Serializable): void {
    const insertionData = this.createInsertionData(serializable);
    this.settings.dbClient.insertRow(this.settings.table, insertionData);
  }

  public get(): Promise<T[]> {
    return new Promise<T[]>(this.getExecutor);
  }

  public getSorted(sortColumn: string = ""): Promise<T[]> {
    if (sortColumn.length > 0) this.settings.sortColumn = sortColumn;
    return new Promise<T[]>(this.getSortedExecutor);
  }

  public update(serializable: Serializable): void {
    const insertionData = this.createInsertionData(serializable);
    const conditions = this.getSerializableCondition(serializable).concat(
      this.getCommonSerializableCondition(serializable)
    );
    this.settings.dbClient.updateRows(
      this.settings.table,
      insertionData,
      conditions
    );
  }

  public delete(serializables: Serializable[]): void {
    const deletionColumns = this.createDeletionColumns();
    const deletionValues = this.createDeletionValues(serializables);

    this.settings.dbClient.deleteRows(
      this.settings.table,
      deletionColumns,
      deletionValues
    );
  }

  private createDeletionColumns() {
    const specificIdentifierColumns = this.getDeletionIdentifierColumns();
    const commonIdentifierColumns = this.commonIdentifierColumns();
    return specificIdentifierColumns.concat(commonIdentifierColumns);
  }

  private createDeletionValues(serializables: Serializable[]): string[] {
    const serializableValues =
      this.getSerializableDeletionValues(serializables);
    return serializableValues.map((value, index) => {
      return value + `, '${serializables[index].guildId}'`;
    });
  }

  private getExecutor(
    resolve: (value: T[] | PromiseLike<T[]>) => void,
    _reject: (reason?: any) => void
  ): void {
    const conditions = this.getCondition();
    conditions.push(...this.getGuildCondition());

    this.settings.dbClient.selectRows(
      this.settings.table,
      this.settings.columns,
      conditions,
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

  private createInsertionData(serializable: Serializable) {
    const dbValues = this.getSerializeValues(serializable);
    const serializableData = this.generateSerializableDBData(dbValues);
    const commonData = this.generateCommonDBData(serializable);
    return serializableData.concat(commonData);
  }

  private generateSerializableDBData(values: string[]): IColumnsAndValues[] {
    return this.settings.columns.map((col, idx) => {
      return {
        columnName: col,
        value: values[idx],
      };
    });
  }

  private generateCommonDBData(serializable: Serializable): IColumnsAndValues {
    return {
      columnName: SerializerIds.guild,
      value: serializable.guildId,
    };
  }

  private getGuildCondition(): string[] {
    var conditions = [];
    if (this.settings.guildId !== "")
      conditions.push(`${SerializerIds.guild} = '${this.settings.guildId}'`);
    return conditions;
  }

  private commonIdentifierColumns(): string[] {
    return [SerializerIds.guild];
  }

  private getCommonSerializableCondition(serializable: Serializable): string[] {
    return [`${SerializerIds.guild} = '${serializable.guildId}'`];
  }

  protected abstract getTypeArrayFromSQLResponse(
    response: RowDataPacket[]
  ): T[];
  protected abstract getSerializableCondition(
    serializable: Serializable
  ): string[];
  protected abstract getCondition(): string[];
  protected abstract getSerializeValues(serializable: Serializable): string[];
  protected abstract getDeletionIdentifierColumns(): string[];
  protected abstract getSerializableDeletionValues(
    serializables: Serializable[]
  ): string[];
}
