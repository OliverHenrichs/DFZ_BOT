import { Message, MessageEmbed } from "discord.js";
import { generateEmbedding } from "../misc/answerEmbedding";
import { lobbyTypeKeys, lobbyTypeKeysString } from "../misc/constants";
import { FieldElement } from "../misc/interfaces/EmbedInterface";
import { reactPositive } from "../misc/messageHelper";
import {
  findRole,
  adminRoles,
  getAllRegionStrings,
} from "../misc/roleManagement";

// handles !helpme command
export default async (message: Message) => {
  if (!isPostedByAdmin(message)) return;

  const embed = generateHelpMessageEmbedding();

  message.author.send({ embed: embed });
  reactPositive(message, "");
};

function isPostedByAdmin(message: Message) {
  return (
    message.member !== null &&
    findRole(message.member, adminRoles) !== undefined
  );
}

function generateHelpMessageEmbedding(): MessageEmbed {
  var embed = generateEmbedding("Bot commands", "", "");
  addHelpTopicsToEmbed(embed);
  return embed;
}

function addHelpTopicsToEmbed(embed: MessageEmbed) {
  addHelpHint(embed);
  addPostLobbyHint(embed);
  addUpdateLobbyHint(embed);
  addKickPlayerHint(embed);
  addHighscoreHint(embed);
}

function addHelpHint(embed: MessageEmbed) {
  addFieldsToEmbed(
    embed,
    generateHelpEmbedFields(
      "help",
      "!help / !helpme",
      "Shows you the info you are looking at right now 😉\n Use !helpme to avoid also getting a message from MEE6-bot.",
      "!help"
    )
  );
}

function addPostLobbyHint(embed: MessageEmbed) {
  addFieldsToEmbed(
    embed,
    generateHelpEmbedFields(
      "post",
      "!post <lobbytype> <region> <tiers> <time> <timezone>",
      "Creates a lobby in the channel in which you write the command.\nLobby types: " +
        lobbyTypeKeysString +
        "\nRegions: " +
        getAllRegionStrings().join(", ") +
        "\n Allowed tiers: 0,1,2,3,4; Give no tiers nor regions for lobby types 'tryout' and 'replayAnalysis'." +
        "\n time format: 1-12:00-59am/pm " +
        "\n timezone: CET, ... check https://kevinnovak.github.io/Time-Zone-Picker/ to find your timezone name.",
      "!post " +
        lobbyTypeKeys[0] +
        " EU 1,2 9:55pm GMT+2\n\n!post " +
        lobbyTypeKeys[1] +
        " SEA 4,3 10:00am Asia/Singapore\n\n!post " +
        lobbyTypeKeys[3] +
        " 9:55pm America/New_York\n\n!post " +
        lobbyTypeKeys[4] +
        " 1:03am Arctic/Longyearbyen\n\n!post " +
        lobbyTypeKeys[5] +
        " 10:00am CET coaches This is a very important meeting topic"
    )
  );
}

function addUpdateLobbyHint(embed: MessageEmbed) {
  addFieldsToEmbed(
    embed,
    generateHelpEmbedFields(
      "update",
      "!update <msgId> -tiers <tiers>",
      "Updates the lobby that is associated with the given message-ID " +
        "(get lobby's message-ID: activate developer mode in Discord options, " +
        "then rightclick the lobby post and click 'copy ID')\n" +
        "Available options: -tiers <tiers> Give tiers you want to allow in this lobby (e.g. '1,2')",
      "!update 791413627105312769 -tiers 1,2,3"
    )
  );
}

function addHighscoreHint(embed: MessageEmbed) {
  addFieldsToEmbed(
    embed,
    generateHelpEmbedFields(
      "highscore",
      "!highscore -userType <type>",
      "Shows you an all-time ranking displaying who coached or played how much",
      "!highscore\n!highscore -userType players\n!highscore -ut coaches"
    )
  );
}

function addKickPlayerHint(embed: MessageEmbed) {
  addFieldsToEmbed(
    embed,
    generateHelpEmbedFields(
      "kick",
      "!kick <msgId> <playerId>",
      "Kicks a player from the lobby that is associated \
      with the given message-ID using their user-ID (rightclick them in the lobby-post). \
      The intend of this is to remove players who did not show up and to then reroll teams based on the remaining players.",
      "!kick 843255195735031829 366594625210679309"
    )
  );
}

function addFieldsToEmbed(embed: MessageEmbed, fields: FieldElement[]) {
  if (embed.fields.length == 0) embed.fields = fields;
  else embed.fields = embed.fields.concat(fields);
}

function generateHelpEmbedFields(
  name: string,
  command: string,
  functionality: string,
  example: string
): FieldElement[] {
  var field = getInitialHelpFields(name);

  field[0].value += command + "\n";
  field[1].value += example + "\n";
  field[2].value += functionality + "\n";
  return field;
}

function getInitialHelpFields(name: string): FieldElement[] {
  return [
    {
      name: name,
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
}
