import { GuildMember, MessageReaction, Role, User } from "discord.js";
import { isWatchingChannel } from "./channelManagement";
import { findLobbyByMessage } from "./lobbyManagement";
import {
  findRole,
  beginnerRoles,
  adminRoles,
  tryoutRole,
} from "./roleManagement";
import { DFZDiscordClient } from "../types/DFZDiscordClient";
import { Lobby } from "../types/serializables/lobby";

export class LobbyReactionInfo {
  lobby: Lobby;
  member: GuildMember;
  role: Role;

  constructor(lobby: Lobby, member: GuildMember, role: Role) {
    this.lobby = lobby;
    this.member = member;
    this.role = role;
  }
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
): Promise<LobbyReactionInfo | undefined> {
  // find lobby
  const lobby = await findLobbyByMessage(
    client.dbClient,
    reaction.message.channel.id,
    reaction.message.id
  );
  if (lobby === undefined) return undefined;

  // get guild member (has role)
  const guildMember = await reaction.message.guild?.members.fetch(user.id);
  if (guildMember === undefined) return undefined;

  // get role
  var role = findRole(
    guildMember,
    beginnerRoles.concat(adminRoles, [tryoutRole])
  );

  if (role === undefined || role === null) {
    user.send(
      "⛔ You cannot interact because you do not have the appropriate role."
    );
    return undefined;
  }

  return new LobbyReactionInfo(lobby, guildMember, role);
}

export function isValidLobbyReaction(
  reaction: MessageReaction,
  user: User
): boolean {
  // only care for messages from self
  if (reaction.message.author.id !== process.env.BOT_ID) return false;

  // ignore reactions from self
  if (user.id === process.env.BOT_ID) return false;

  // ignore bot's DMs
  if (reaction.message.channel === undefined) return false;

  // Ignore messages outside of bot channels
  if (!isWatchingChannel(reaction.message.channel.id)) return false;

  return true;
}
