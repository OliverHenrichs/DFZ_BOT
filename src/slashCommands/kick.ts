import { KickSlashCommandBuilder } from "../logic/discord/CommandBuilders/KickSlashCommandBuilder";
import { KickExecutor } from "../logic/discord/CommandExecutors/KickExecutor";

module.exports = {
  name: "kick",
  create: async () => {
    return {
      data: new KickSlashCommandBuilder(),
      executor: new KickExecutor(),
    };
  },
};
