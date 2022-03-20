import { UpdateSlashCommandBuilder } from "../logic/discord/CommandBuilders/UpdateSlashCommandBuilder";
import { UpdateExecutor } from "../logic/discord/CommandExecutors/UpdateExecutor";
import { SlashCommandIds } from "../logic/discord/enums/SlashCommandsIds";

module.exports = {
  name: SlashCommandIds.update,
  create: () => {
    return {
      data: new UpdateSlashCommandBuilder(),
      executor: new UpdateExecutor(),
    };
  },
};
