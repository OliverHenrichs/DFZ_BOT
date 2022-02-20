import { SlashCommandBuilder } from "@discordjs/builders";
import { SlashCommandIds } from "../enums/SlashCommandsIds";

export class UpdateSlashCommandBuilder extends SlashCommandBuilder {
  constructor() {
    super();

    this.setName(SlashCommandIds.update)
      .setDescription("Update existing lobby")
      .setDefaultPermission(false);
  }
}
