import { SlashCommandBuilder } from "@discordjs/builders";
import { DFZDiscordClient } from "../DFZDiscordClient";

export class UpdateSlashCommandBuilder extends SlashCommandBuilder {
  constructor(_client: DFZDiscordClient) {
    super();

    this.setName("update")
      .setDescription("Update existing lobby")
      .setDefaultPermission(false);
  }
}
