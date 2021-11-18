import { KickSlashCommandBuilder } from "../logic/discord/CommandBuilders/KickSlashCommandBuilder";
import { KickExecutor } from "../logic/discord/CommandExecutors/KickExecutor";
import { SlashCommandIds } from "../logic/discord/interfaces/SlashCommandsIds";

module.exports = {
  name: SlashCommandIds.kick,
  create: async () => {
    return {
      data: new KickSlashCommandBuilder(),
      executor: new KickExecutor(),
    };
  },
};
