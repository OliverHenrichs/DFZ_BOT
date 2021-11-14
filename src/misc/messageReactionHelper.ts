import { GuildMember, MessageReaction, Role, User } from "discord.js";
import { ChannelManager } from "../logic/discord/DFZChannelManager";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";
import {
  adminRoles,
  beginnerRoles,
  findRole,
  tryoutRole,
} from "../logic/discord/roleManagement";
import { Lobby } from "../logic/serializables/lobby";
import { botId } from "./constants";
import { findLobbyByMessage } from "./messageHelper";

export interface LobbyReactionInfo {
  lobby: Lobby;
  member: GuildMember;
  role: Role;
}

/**
 * Extracts affected lobby, user who sent the message reaction and their role from a message reaction
 * returns false if the reaction does not fit the pattern
 * @param {DFZDiscordClient} client
 * @param {Discord.MessageReaction} reaction
 * @param {Discord.User} reaction
 */
export async function getInfoFromLobbyReaction(
  client: DFZDiscordClient,
  reaction: MessageReaction,
  user: User
): Promise<LobbyReactionInfo> {
  const lobby = await findLobbyByMessage(
    client.dbClient,
    reaction.message.channel.id,
    reaction.message.id
  );
  const guildMember = await fetchGuildMember(reaction, user.id);
  const role = findAndVerifyRole(guildMember, user);

  return {
    lobby: lobby,
    member: guildMember,
    role: role,
  };
}

async function fetchGuildMember(reaction: MessageReaction, userId: string) {
  const guildMember = await reaction.message.guild?.members.fetch(userId);
  if (guildMember === undefined)
    throw new Error("Could not fetch guild member in getInfoFromLobbyReaction");
  return guildMember;
}

function findAndVerifyRole(guildMember: GuildMember, user: User) {
  const role = findRole(
    guildMember,
    beginnerRoles.concat(adminRoles, [tryoutRole])
  );

  if (role === undefined || role === null) {
    user.send(
      "⛔ You cannot interact because you do not have the appropriate role."
    );
    throw new Error(
      "Did not interact because user did not have the appropriate role"
    );
  }

  return role;
}

export function isValidLobbyReaction(
  reaction: MessageReaction,
  user: User
): boolean {
  // only care for messages from self
  if (!reaction.message.author || reaction.message.author.id !== botId)
    return false;

  // ignore reactions from self
  if (user.id === botId) return false;

  // ignore bot's DMs
  if (reaction.message.channel === undefined) return false;

  // Ignore messages outside of bot channels
  if (!ChannelManager.isWatchingChannel(reaction.message.channel.id))
    return false;

  return true;
}
