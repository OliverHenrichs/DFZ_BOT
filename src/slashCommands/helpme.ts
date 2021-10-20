// import { SlashCommandBuilder } from "@discordjs/builders";
// import { CommandInteraction, InteractionReplyOptions } from "discord.js";
// import { generateHelpMessageEmbedding } from "../commands/helpUser";
// import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName("helpme")
//     .setDescription("Tells you everything about the DFZ-Bot commands")
//     .setDefaultPermission(false),
//   async execute(_client: DFZDiscordClient, interaction: CommandInteraction) {
//     const reply: InteractionReplyOptions = {
//       embeds: [generateHelpMessageEmbedding()],
//       ephemeral: true,
//     };
//     await interaction.reply(reply);
//   },
// };
