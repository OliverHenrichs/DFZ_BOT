import { CommandInteraction } from "discord.js";

export class InteractionUtils {
  public static async quitInteraction(
    interaction: CommandInteraction,
    message: string
  ): Promise<void> {
    await interaction.editReply({
      content: message,
    });
  }
}
