import { SlashCommandBuilder } from "@discordjs/builders";
import { SlashCommandIds } from "../interfaces/SlashCommandsIds";

export class PostSchedulesSlashCommandBuilder extends SlashCommandBuilder {
  constructor() {
    super();
    this.setName(SlashCommandIds.postSchedules)
      .setDescription("Posts schedules if they haven't been posted already.")
      .setDefaultPermission(false);
  }
}
