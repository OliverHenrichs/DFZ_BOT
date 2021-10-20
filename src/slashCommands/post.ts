// import { SlashCommandBuilder } from "@discordjs/builders";
// import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";
// import { getLobbyTypeByString, lobbyTypeKeys } from "../misc/constants";
// import {
//   beginnerRoles,
//   getNumberFromBeginnerRole,
//   getRegionalRoleString,
//   getRoleMention,
//   namedBeginnerRoles,
//   namedRegionRoles,
//   regionRoleIDs,
// } from "../logic/discord/roleManagement";
// import { INamedRole } from "../logic/discord/interfaces/NamedRole";
// import {
//   MessageActionRow,
//   MessageSelectMenu,
//   MessageSelectOptionData,
// } from "discord.js";
// import { ChannelManager } from "../logic/discord/ChannelManager";

// module.exports = {
//   data: createPostSlashCommandBuilder(),
//   async execute(client: DFZDiscordClient, interaction: any) {
//     const row = new MessageActionRow().addComponents(
//       addChannelOptionsSelectMenu()
//     );

//     await interaction.reply({
//       content: "Make proper choices and press post",
//       components: [row],
//     });
//   },
// };

// function createPostSlashCommandBuilder() {
//   let builder = new SlashCommandBuilder()
//     .setName("post")
//     .setDescription("Posts lobbies. Check /helpme for help")
//     .setDefaultPermission(false);
//   addTypeOption(builder);
//   addChannelOption(builder);
//   addRegionOption(builder);
//   addTierOption(builder);
//   addTimeOption(builder);
//   addTimeZoneOption(builder);

//   return builder;
// }

// function addTypeOption(builder: SlashCommandBuilder) {
//   builder.addNumberOption((option) =>
//     option
//       .setName("type")
//       .setDescription("What type of lobby should be started?")
//       .setRequired(true)
//       .addChoices(getOptionTypeChoices())
//   );
// }

// function addChannelOption(builder: SlashCommandBuilder) {
//   builder.addChannelOption((option) =>
//     option
//       .setName("channel")
//       .setDescription("In which channel should the lobby be posted?")
//       .setRequired(true)
//   );
// }

// function addRegionOption(builder: SlashCommandBuilder) {
//   builder.addRoleOption((option) =>
//     option
//       .setName("region")
//       .setDescription(
//         "What kind of region should the lobby be preferring? If none, then "
//       )
//       .setRequired(false)
//   );
// }

// function addTierOption(builder: SlashCommandBuilder) {
//   builder.addRoleOption((option) =>
//     option
//       .setName("tier#1")
//       .setDescription(
//         "Which tier should the players be in. Use multiple tier options to allow multiple tiers"
//       )
//       .setRequired(false)
//   );
// }

// function addTimeOption(builder: SlashCommandBuilder) {
//   builder.addSubcommand((sc) =>
//     sc
//       .setName("time")
//       .setDescription("Which time should the lobby start")
//       .addNumberOption((option) =>
//         option
//           .setRequired(true)
//           .setDescription("What hour should the lobby start (0-23)")
//       )
//       .addNumberOption((option) =>
//         option
//           .setRequired(true)
//           .setDescription("What minute should the lobby start (0-59)")
//       )
//   );
// }

// function addTimeZoneOption(builder: SlashCommandBuilder) {
//   builder.addStringOption((sc) =>
//     sc
//       .setName("timezone")
//       .setDescription("Which timezone is the lobby in? Check")
//   );
// }

// function getOptionTypeChoices() {
//   return getOptionChoices<number>(lobbyTypeKeys, getLobbyTypeByString);
// }

// function getOptionRegionChoices() {
//   return getOptionChoicesByNamedRole(namedRegionRoles);
// }

// function getOptionTierChoices() {
//   return getOptionChoicesByNamedRole(namedBeginnerRoles);
// }

// function getOptionChoicesByNamedRole(
//   namedRoles: INamedRole[]
// ): [string, string][] {
//   return namedRoles.map((namedRole) => [namedRole.name, namedRole.id]);
// }

// function getOptionChoices<T>(
//   choiceList: string[],
//   valueGetter: (key: string) => T
// ) {
//   const typeChoiceList: [string, T][] = [];
//   choiceList.forEach((key) => {
//     typeChoiceList.push([key, valueGetter(key)]);
//   });
//   return typeChoiceList;
// }

// function addChannelOptionsSelectMenu() {
//   return createSelectMenu({
//     customId: "Channel",
//     placeHolder: "Choose Channel",
//     minValues: 1,
//     maxValues: 1,
//     selectOptions: ChannelManager.lobbyChannels.map((channelId) => {
//       return {
//         label: getRoleMention(channelId),
//         description: "",
//         value: channelId,
//       };
//     }),
//   });
// }

// /*[
//       {
//         label: "Select me",
//         description: "This is a description",
//         value: "first_option",
//       },
//       {
//         label: "You can select me too",
//         description: "This is also a description",
//         value: "second_option",
//       },
//       {
//         label: "I am also an option",
//         description: "This is a description as well",
//         value: "third_option",
//       },
//     ]*/
// interface SelectMenuOptions {
//   customId: string;
//   placeHolder: string;
//   minValues: number;
//   maxValues: number;
//   selectOptions: MessageSelectOptionData[];
// }

// function createSelectMenu(options: SelectMenuOptions) {
//   return new MessageSelectMenu()
//     .setCustomId(options.customId)
//     .setPlaceholder(options.placeHolder)
//     .setMinValues(options.minValues)
//     .setMaxValues(options.maxValues)
//     .addOptions(options.selectOptions);
// }
