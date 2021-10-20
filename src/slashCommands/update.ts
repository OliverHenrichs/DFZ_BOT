// import { SlashCommandBuilder } from "@discordjs/builders";
// import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";

// module.exports = {
//   data: new SlashCommandBuilder()
//     .setName("update")
//     .setDescription("Update existing lobby")
//     .addChannelOption((option) =>
//       option
//         .setName("lobby_channel")
//         .setDescription("Select a channel")
//         .setRequired(true)
//     )
//     .addStringOption((option) =>
//       option
//         .setName("message_id")
//         .setDescription("Give message ID of lobby post")
//         .setRequired(true)
//     )
//     .setDefaultPermission(false),
//   async execute(client: DFZDiscordClient, interaction: any) {
//     console.log(client.token);

//     await interaction.reply("Successfully updated lobby");
//   },
// };
