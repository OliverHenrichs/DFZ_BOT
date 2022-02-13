import { SlashCommandBuilder } from "@discordjs/builders";
import { SlashCommandIds } from "../interfaces/SlashCommandsIds";
import { CommandBuilderOptionUtils } from "./CommandBuilderOptionUtils";

export class HighScoreCommandBuilder extends SlashCommandBuilder {
  constructor() {
    super();
    this.setName(SlashCommandIds.highScore)
      .setDescription("Show high score for players and coaches.")
      .setDefaultPermission(false);
    CommandBuilderOptionUtils.addCoachPlayerOption(this);
  }
}
