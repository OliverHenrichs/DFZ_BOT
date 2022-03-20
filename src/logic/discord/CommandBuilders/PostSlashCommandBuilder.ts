import { SlashCommandBuilder } from "@discordjs/builders";
import { SlashCommandIds } from "../enums/SlashCommandsIds";
import { CommandBuilderOptionUtils } from "../Utils/CommandBuilderOptionUtils";

export class PostSlashCommandBuilder extends SlashCommandBuilder {
  constructor() {
    super();

    this.setName(SlashCommandIds.post)
      .setDescription("Post new lobby.")
      .setDefaultPermission(false);

    CommandBuilderOptionUtils.addTypeOption(this);
    CommandBuilderOptionUtils.addTimeOption(this);
    CommandBuilderOptionUtils.addFreeTextOption(this);
  }
}
