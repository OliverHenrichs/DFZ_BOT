import { Client, ClientOptions } from "discord.js";
import { Pool } from "mysql2/promise";
import { LobbyTimeout } from "../interfaces/asdf";

export class DFZDiscordClient extends Client {
  dbHandle: Pool;
  timeouts: LobbyTimeout[] = [];
  constructor(dbHandle: Pool, options?: ClientOptions | undefined) {
    super(options);
    this.dbHandle = dbHandle;
  }
}
