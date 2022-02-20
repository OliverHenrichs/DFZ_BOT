import { DFZDataBaseClient } from "../../database/DFZDataBaseClient";

export interface IGuildDataBaseClient {
  dbClient: DFZDataBaseClient;
  guildId: string;
}
