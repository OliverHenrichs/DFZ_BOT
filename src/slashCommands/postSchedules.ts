import { PostSchedulesSlashCommandBuilder } from "../logic/discord/CommandBuilders/PostSchedulesSlashCommandBuilder";
import { PostSchedulesExecutor } from "../logic/discord/CommandExecutors/PostSchedulesExecutor";
import { SlashCommandIds } from "../logic/discord/enums/SlashCommandsIds";

module.exports = {
  name: SlashCommandIds.postSchedules,
  create: async () => {
    return {
      data: new PostSchedulesSlashCommandBuilder(),
      executor: new PostSchedulesExecutor(),
    };
  },
};
