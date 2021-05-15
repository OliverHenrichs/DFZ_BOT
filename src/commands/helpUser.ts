import { Message, MessageEmbed } from "discord.js";
import { generateEmbedding } from "../misc/answerEmbedding";
import { lobbyTypes } from "../misc/constants";
import { reactPositive } from "../misc/messageHelper";
import {
  findRole,
  adminRoles,
  getRegionalRoleStringsForCommand,
} from "../misc/roleManagement";

/**
 * Creates string to add to help-embedding and augments embed with it
 * @param {MessageEmbed} embed
 * @param {string} short
 * @param {string} command
 * @param {string} functionality
 * @param {string} example
 */
function addHelpToTable(
  embed: MessageEmbed,
  short: string,
  command: string,
  functionality: string,
  example: string
) {
  // table for embed
  var tableBase = [
    {
      name: short,
      value: "",
      inline: true,
    },
    {
      name: "Example(s)",
      value: "",
      inline: true,
    },
    {
      name: "Function",
      value: "",
      inline: true,
    },
  ];

  tableBase[0].value += command + "\n";
  tableBase[1].value += example + "\n";
  tableBase[2].value += functionality + "\n";

  if (embed.fields.length == 0) embed.fields = tableBase;
  else embed.fields = embed.fields.concat(tableBase);
}

/**
 * Returns available bot commands depending on role
 */
export default async (message: Message) => {
  // create embed
  var _embed = generateEmbedding("Bot commands", "", "");

  addHelpToTable(
    _embed,
    "help",
    "!help / !helpme",
    "Shows you the info you are looking at right now 😉\n Use !helpme to avoid also getting a message from MEE6-bot.",
    "!help"
  );

  // help admin commands
  if (
    message.member !== null &&
    findRole(message.member, adminRoles) !== undefined
  ) {
    addHelpToTable(
      _embed,
      "post",
      "!post <lobbytype> <region> <tiers> <time> <timezone>",
      "Creates a lobby in the channel in which you write the command.\nLobby types: " +
        Object.keys(lobbyTypes).join(", ") +
        "\nRegions: " +
        getRegionalRoleStringsForCommand().join(", ") +
        "\n Allowed tiers: 1,2,3,4; Give no tiers nor regions for lobby types 'tryout' and 'replayAnalysis'." +
        "\n time format: 1-12:00-59am/pm " +
        "\n timezone: CET, ... check https://kevinnovak.github.io/Time-Zone-Picker/ to find your timezone name.",
      "!post " +
        Object.keys(lobbyTypes)[0] +
        " EU 1,2 9:55pm GMT+2\n\n!post " +
        Object.keys(lobbyTypes)[1] +
        " SEA 4,3 10:00am Asia/Singapore\n\n!post " +
        Object.keys(lobbyTypes)[3] +
        " 9:55pm America/New_York\n\n!post " +
        Object.keys(lobbyTypes)[4] +
        " 1:03am Arctic/Longyearbyen\n\n!post " +
        Object.keys(lobbyTypes)[5] +
        " 10:00am CET"
    );

    addHelpToTable(
      _embed,
      "update",
      "!update <msgId> -tiers <tiers>",
      "Updates the lobby that is associated with the given message-ID " +
        "(get lobby's message-ID: activate developer mode in Discord options, " +
        "then rightclick the lobby post and click 'copy ID')\n" +
        "Available options: -tiers <tiers> Give tiers you want to allow in this lobby (e.g. '1,2')",
      "!update 791413627105312769 -tiers 1,2,3"
    );

    addHelpToTable(
      _embed,
      "highscore",
      "!highscore -type <type>",
      "Shows you an all-time ranking displaying who coached or played how much",
      "!highscore\n!highscore -type normal\n!highscore -type tryout"
    );

    addHelpToTable(
      _embed,
      "kick",
      "!kick <msgId> <playerId>",
      "Kicks a player from the lobby that is associated \
      with the given message-ID using their user-ID (rightclick them in the lobby-post). \
      The intend of this is to remove players who did not show up and to then reroll teams based on the remaining players.",
      "!kick 843255195735031829 366594625210679309"
    );

    message.author.send({ embed: _embed });
    reactPositive(message, "");
  }
};
