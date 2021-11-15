import { UpdateSlashCommandBuilder } from "../logic/discord/CommandBuilders/UpdateSlashCommandBuilder";
import { UpdateExecutor } from "../logic/discord/CommandExecutors/UpdateExecutor";

module.exports = {
  name: "update",
  create: () => {
    return {
      data: new UpdateSlashCommandBuilder(),
      executor: new UpdateExecutor(),
    };
  },
};
