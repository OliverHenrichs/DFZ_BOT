import { CommandInteraction } from "discord.js";
import { postSchedules } from "../../../misc/scheduleManagement";
import { DFZDiscordClient } from "../DFZDiscordClient";
import { InteractionUtils } from "../Utils/InteractionUtils";
import { AbstractExecutor } from "./AbstractExecutor";

export class PostSchedulesExecutor extends AbstractExecutor {
  public async execute(
    client: DFZDiscordClient,
    interaction: CommandInteraction
  ): Promise<void> {
    try {
      await postSchedules(client);
      InteractionUtils.quitInteraction(
        interaction,
        "I posted this week's schedules"
      );
    } catch (error) {
      InteractionUtils.quitInteraction(interaction, error as string);
    }
  }
}
