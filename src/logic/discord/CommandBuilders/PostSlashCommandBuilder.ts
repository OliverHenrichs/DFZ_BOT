import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandBuilderOptionUtils } from "./CommandBuilderOptionUtils";

export class PostSlashCommandBuilder extends SlashCommandBuilder {
  constructor() {
    super();

    this.setName("post")
      .setDescription("Post new lobby.")
      .setDefaultPermission(false);

    CommandBuilderOptionUtils.addTypeOption(this);
    CommandBuilderOptionUtils.addTimeOption(this);
    CommandBuilderOptionUtils.addFreeTextOption(this);
  }
}
