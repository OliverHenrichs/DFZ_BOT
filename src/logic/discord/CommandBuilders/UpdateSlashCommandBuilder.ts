import { SlashCommandBuilder } from "@discordjs/builders";

export class UpdateSlashCommandBuilder extends SlashCommandBuilder {
  constructor() {
    super();

    this.setName("update")
      .setDescription("Update existing lobby")
      .setDefaultPermission(false);
  }
}
