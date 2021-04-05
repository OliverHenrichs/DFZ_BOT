import { Client, ClientOptions } from "discord.js";
import { Pool } from "mysql2/promise";

export class DFZDiscordClient extends Client {
  dbHandle: Pool;
  constructor(dbHandle: Pool, options?: ClientOptions | undefined) {
    super(options);
    this.dbHandle = dbHandle;
  }
}
