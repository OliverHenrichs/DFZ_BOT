// import { REST } from "@discordjs/rest";
// import { ApplicationCommand, Guild } from "discord.js";
// import fs from "fs";
// import { botId, botToken, guildId } from "../../misc/constants";
// import { adminRoles } from "./roleManagement";
// import { DFZDiscordClient } from "./DFZDiscordClient";
// import { Routes } from "discord-api-types/rest/v9";

// export class SlashCommandRegistrator {
//   client: DFZDiscordClient;
//   rest: REST;
//   commands: any[] = [];

//   constructor(client: DFZDiscordClient) {
//     this.client = client;
//     this.rest = new REST({ version: "9" }).setToken(botToken);
//     this.registerCommandFiles();
//   }

//   public async registerSlashCommands() {
//     try {
//       this.tryRegisterSlashCommands();
//     } catch (error) {
//       console.error(error);
//     }
//   }

//   private async tryRegisterSlashCommands() {
//     await this.rest.put(Routes.applicationGuildCommands(botId, guildId), {
//       body: this.commands,
//     });
//   }

//   public async setCommandPermissions(guild: Guild) {
//     const commands = await guild.commands.fetch();

//     const fullPermissions: any[] = [];
//     commands.forEach((cmd) => {
//       this.addCommandPermission(cmd, fullPermissions);
//     });

//     await guild.commands.permissions.set({
//       fullPermissions: fullPermissions,
//     });
//   }

//   private addCommandPermission(
//     cmd: ApplicationCommand<{}>,
//     fullPermissions: any[]
//   ) {
//     const commandPermission: any = {
//       id: cmd.id,
//       permissions: [],
//     };
//     this.addAdminRolePermissions(commandPermission);

//     fullPermissions.push(commandPermission);
//   }

//   private addAdminRolePermissions(commandPermission: any) {
//     adminRoles.forEach((role) => {
//       commandPermission.permissions.push({
//         id: role,
//         type: "ROLE",
//         permission: true,
//       });
//     });
//   }

//   private registerCommandFiles() {
//     const commandFiles = fs.readdirSync(`${__dirname}/../../slashCommands/`);
//     for (const file of commandFiles) {
//       const command = require(`${__dirname}/../../slashCommands/${file}`);
//       this.commands.push(command.data.toJSON());
//     }
//   }
// }
