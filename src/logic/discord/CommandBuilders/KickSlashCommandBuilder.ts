import { SlashCommandBuilder } from "@discordjs/builders";
import { SlashCommandIds } from "../interfaces/SlashCommandsIds";

export class KickSlashCommandBuilder extends SlashCommandBuilder {
  constructor() {
    super();

    this.setName(SlashCommandIds.kick)
      .setDescription("Kick a player from a lobby.")
      .setDefaultPermission(false);
  }
}
