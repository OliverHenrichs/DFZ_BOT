import { CommandInteraction } from "discord.js";
import { postSchedules } from "../../../misc/scheduleManagement";
import { IGuildClient } from "../../../misc/types/IGuildClient";
import { DFZDiscordClient } from "../DFZDiscordClient";
import { InteractionUtils } from "../Utils/InteractionUtils";
import { AbstractExecutor } from "./AbstractExecutor";

export class PostSchedulesExecutor extends AbstractExecutor {
  public async execute(
    client: DFZDiscordClient,
    interaction: CommandInteraction
  ): Promise<void> {
    try {
      if (!interaction.guild) {
        throw new Error("No associated guild");
      }
      const guildClient: IGuildClient = {
        client,
        guild: interaction.guild,
      };
      await postSchedules(guildClient);
      InteractionUtils.quitInteraction(
        interaction,
        "I posted this week's schedules"
      );
    } catch (error) {
      InteractionUtils.quitInteraction(interaction, error as string);
    }
  }
}
