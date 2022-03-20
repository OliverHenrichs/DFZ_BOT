import { CommandInteraction } from "discord.js";
import { DFZDiscordClient } from "../DFZDiscordClient";
import { AbstractExecutor } from "./AbstractExecutor";
import HighscoreProviderFactory from "../../highscore/factories/HighscoreProviderFactory";
import { CommandOptionNames } from "../enums/CommandOptionNames";
import { HighScoreUserTypes } from "../../highscore/enums/HighScoreUserTypes";

export class HighScoreExecutor extends AbstractExecutor {
  private static getHighScoreType(
    interaction: CommandInteraction
  ): HighScoreUserTypes {
    const playerOrCoach = interaction.options.getString(
      CommandOptionNames.playerOrCoach
    );
    if (playerOrCoach === HighScoreUserTypes.coaches) {
      return HighScoreUserTypes.coaches;
    }
    return HighScoreUserTypes.players;
  }

  public async execute(
    client: DFZDiscordClient,
    interaction: CommandInteraction
  ): Promise<void> {
    if (!interaction.guildId) {
      throw new Error("The interaction does not provide a guild id");
    }

    const userType = HighScoreExecutor.getHighScoreType(interaction);
    const provider = HighscoreProviderFactory(userType, client.dbClient);
    const embedding = await provider.generateHighScoreEmbedding(
      interaction.guildId,
      interaction.guild?.name
    );
    await interaction.editReply({
      content: userType + " highscore",
      embeds: [embedding],
    });
  }
}
