import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/rest/v9";
import { ApplicationCommand, Collection, Guild } from "discord.js";
import fs from "fs";
import { botId, botToken, dfzGuildId } from "../../misc/constants";
import { DFZDiscordClient } from "./DFZDiscordClient";
import { adminRoles } from "./roleManagement";

export class SlashCommandRegistrator {
  client: DFZDiscordClient;
  rest: REST;
  commands = new Collection<string, any>();

  constructor(client: DFZDiscordClient) {
    this.client = client;
    this.rest = new REST({ version: "9" }).setToken(botToken);
  }

  public async tryRegisterSlashCommands() {
    try {
      this.registerSlashCommands();
    } catch (error) {
      console.error(error);
    }
  }

  private async registerSlashCommands() {
    await this.rest.put(Routes.applicationGuildCommands(botId, dfzGuildId), {
      body: this.commands.map((value) => value.data),
    });
  }

  public async setCommandPermissions(guild: Guild) {
    const commands = await guild.commands.fetch();

    const fullPermissions: any[] = [];
    commands.forEach((cmd) => {
      this.addCommandPermission(cmd, fullPermissions);
    });

    await guild.commands.permissions.set({
      fullPermissions: fullPermissions,
    });
  }

  private addCommandPermission(
    cmd: ApplicationCommand<{}>,
    fullPermissions: any[]
  ) {
    const commandPermission: any = {
      id: cmd.id,
      permissions: [],
    };
    this.addAdminRolePermissions(commandPermission);

    fullPermissions.push(commandPermission);
  }

  private addAdminRolePermissions(commandPermission: any) {
    adminRoles.forEach((role) => {
      commandPermission.permissions.push({
        id: role,
        type: "ROLE",
        permission: true,
      });
    });
  }

  public async registerCommandFiles(client: DFZDiscordClient) {
    const commandFiles = fs.readdirSync(`${__dirname}/../../slashCommands/`);
    for (const file of commandFiles) {
      const commandCreator = require(`${__dirname}/../../slashCommands/${file}`);
      const commandData = await commandCreator.create(client);

      this.commands.set(commandCreator.name, commandData);
    }
  }
}
