import { UpdateSlashCommandBuilder } from "../logic/discord/CommandBuilders/UpdateSlashCommandBuilder";
import { UpdateExecutor } from "../logic/discord/CommandExecutors/UpdateExecutor";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";

module.exports = {
  name: "update",
  create: (client: DFZDiscordClient) => {
    return {
      data: new UpdateSlashCommandBuilder(client),
      executor: new UpdateExecutor(),
    };
  },
};
