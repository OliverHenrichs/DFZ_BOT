import { PostSlashCommandBuilder } from "../logic/discord/CommandBuilders/PostSlashCommandBuilder";
import { PostExecutor } from "../logic/discord/CommandExecutors/PostExecutor";

module.exports = {
  name: "post",
  create: async () => {
    return {
      data: new PostSlashCommandBuilder(),
      executor: new PostExecutor(),
    };
  },
};
