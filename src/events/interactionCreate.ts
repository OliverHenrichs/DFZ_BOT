import {
  CommandInteraction,
  Interaction,
  SelectMenuInteraction,
} from "discord.js";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";

module.exports = async function (
  client: DFZDiscordClient,
  interaction: Interaction,
  event: Error
) {
  if (interaction.isCommand()) return await handleCommand(client, interaction);
  if (interaction.isSelectMenu())
    return await handleSelectMenu(client, interaction);
};

async function handleSelectMenu(
  client: DFZDiscordClient,
  interaction: SelectMenuInteraction
) {
  console.log("Custom id: " + interaction.customId);

  interaction.update({ content: "asdf" });
}

async function handleCommand(
  client: DFZDiscordClient,
  interaction: CommandInteraction
) {
  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(client, interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
}
