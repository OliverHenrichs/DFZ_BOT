import { Client } from "discord.js";
import Pool from "mysql2/typings/mysql/lib/Pool";

export interface DFZDiscordClient extends Client {
  dbHandle: Pool;
}
