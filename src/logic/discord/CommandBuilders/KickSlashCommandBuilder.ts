import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandBuilderOptionUtils } from "./CommandBuilderOptionUtils";

export class KickSlashCommandBuilder extends SlashCommandBuilder {
  constructor() {
    super();

    this.setName("kick")
      .setDescription("Kick a player from a lobby.")
      .setDefaultPermission(false);
  }
}
