import { Message } from "discord.js";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";

import apply from "../commands/apply";
import helpUser from "../commands/helpUser";
import postLobby from "../commands/postLobby";
import highScore from "../commands/highScore";
import updateLobby from "../commands/updateLobby";
import kick from "../commands/kick";
import postSchedules from "../commands/postSchedules";
import { ChannelManager } from "../logic/discord/ChannelManager";
import { reactNegative } from "../misc/messageHelper";
import { findRole, adminRoles, companionRole } from "../misc/roleManagement";

const PREFIX = "!";

/**
 * Main message handler
 * Filters messages and calls all command subroutines
 * @param {Discord.Client} client discord client
 * @param {Discord.Message} message message to handle
 */
module.exports = async (client: DFZDiscordClient, message: Message) => {
  // Get content
  const content = message.content;

  // Ignore any message that doesn't start with the correct prefix.
  if (!content.startsWith(PREFIX)) {
    return;
  }

  // Ignore messages from self
  if (message.author.id === process.env.BOT_ID) {
    return;
  }

  // Ignore non-guild-members
  if (message.member === null) return;

  // Ignore DMs
  if (message.channel.type === "dm") {
    return reactNegative(message, "Bot doesn't support DMs!");
  }

  // handle applications
  if (
    ChannelManager.signupChannel === message.channel.id &&
    content.startsWith("!apply")
  ) {
    return apply(client, message);
  }

  // Ignore messages outside of bot channels
  if (!ChannelManager.isWatchingChannel(message.channel.id)) {
    return reactNegative(
      message,
      "I only listen to messages in the channels " +
        ChannelManager.channelStrings
    );
  }

  // handle admin commands
  if (findRole(message.member, adminRoles) != undefined) {
    if (content.startsWith("!help") || content.startsWith("!helpme")) {
      return helpUser(message);
    }
    if (content.startsWith("!schedules")) {
      return postSchedules(message, client);
    }
    if (content.startsWith("!post")) {
      return postLobby(message, client.dbClient);
    }
    if (content.startsWith("!update")) {
      return updateLobby(message, client.dbClient);
    }
    if (content.startsWith("!highscore")) {
      return highScore(message, client.dbClient);
    }
    if (content.startsWith("!kick")) {
      return kick(message, client.dbClient);
    }
  }

  // handle companion commands
  if (findRole(message.member, [companionRole]) != undefined) {
    if (content.startsWith("!post")) {
      return postLobby(message, client.dbClient);
    }
  }
};
