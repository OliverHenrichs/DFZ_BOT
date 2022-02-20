import { GuildMember, MessageReaction, Role, User } from "discord.js";
import { ChannelManager } from "../logic/discord/DFZChannelManager";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";
import {
  adminRoles,
  beginnerRoles,
  findRole,
  tryoutRole,
} from "../logic/discord/RoleManagement";
import { Lobby } from "../logic/serializables/Lobby";
import { botId } from "./constants";
import { findLobbyByMessage } from "./messageHelper";
import { IMessageIdentifier } from "./types/IMessageIdentifier";

export interface LobbyReactionInfo {
  lobby: Lobby;
  member: GuildMember;
  role: Role;
}

export async function getInfoFromLobbyReaction(
  client: DFZDiscordClient,
  reaction: MessageReaction,
  user: User
): Promise<LobbyReactionInfo> {
  if (!reaction.message.guildId) {
    throw new Error("No associated guild");
  }
  const mId: IMessageIdentifier = {
    messageId: reaction.message.id,
    channelId: reaction.message.channel.id,
    guildId: reaction.message.guildId,
  };
  const lobby = await findLobbyByMessage(client.dbClient, mId);
  const guildMember = await fetchGuildMember(reaction, user.id);
  const role = await findAndVerifyRole(guildMember, user);

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

async function findAndVerifyRole(guildMember: GuildMember, user: User) {
  const role = findRole(
    guildMember,
    beginnerRoles.concat(adminRoles, [tryoutRole])
  );

  if (role === undefined || role === null) {
    await user.send(
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
  return ChannelManager.isWatchingChannel(reaction.message.channel.id);
}
