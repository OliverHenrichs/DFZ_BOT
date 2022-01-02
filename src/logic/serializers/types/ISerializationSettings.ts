import { DFZDataBaseClient } from "../../database/DFZDataBaseClient";

export interface ISerializationSettings {
  dbClient: DFZDataBaseClient;
  guildId: string;
  table: string;
  columns: string[];
  sortColumn: string;
}
