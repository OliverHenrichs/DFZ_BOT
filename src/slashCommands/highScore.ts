import { SlashCommandIds } from "../logic/discord/interfaces/SlashCommandsIds";
import { HighScoreCommandBuilder } from "../logic/discord/CommandBuilders/HighScoreCommandBuilder";
import { HighScoreExecutor } from "../logic/discord/CommandExecutors/HighScoreExecutor";

module.exports = {
  name: SlashCommandIds.highScore,
  create: async () => {
    return {
      data: new HighScoreCommandBuilder(),
      executor: new HighScoreExecutor(),
    };
  },
};
