import { GuildMember, MessageReaction, Role, User } from "discord.js";
import { DFZDiscordClient } from "./types/DFZDiscordClient";
import { Lobby } from "./types/lobby";

const cM = require("./channelManagement");
const lM = require("./lobbyManagement");
const rM = require("./roleManagement");

export class LobbyReactionInfo {
  lobby: Lobby | undefined;
  member: GuildMember | undefined;
  role: Role | undefined;

  constructor(
    lobby: Lobby | undefined,
    member: GuildMember | undefined,
    role: Role | undefined
  ) {
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
) {
  // find lobby
  const lobby = await lM.findLobbyByMessage(
    client.dbHandle,
    reaction.message.channel.id,
    reaction.message.id
  );

  var res = new LobbyReactionInfo(undefined, undefined, undefined);

  if (lobby === undefined) return res;

  // get guild member (has role)
  const guildMember = await reaction.message.guild?.members.fetch(user.id);

  // get role
  var role = rM.findRole(guildMember, rM.beginnerRoles);
  if (role === undefined || role === null) {
    role = rM.findRole(guildMember, rM.adminRoles);
  }
  if (role === undefined || role === null) {
      role = rM.findRole(guildMember, rM.tryoutRole);
  }

  if (role === undefined || role === null) {
    user.send(
      "⛔ You cannot interact because you do not have the appropriate role."
    );
    return res;
  }

  res.lobby = lobby;
  res.member = guildMember;
  res.role = role;

  return res;
}

export function isValidLobbyReaction(reaction: MessageReaction, user: User) {
  // only care for messages from self
  if (reaction.message.author.id !== process.env.BOT_ID) return false;

  // ignore reactions from self
  if (user.id === process.env.BOT_ID) return false;

  // ignore bot's DMs
  if (reaction.message.channel === undefined) return false;

  // Ignore messages outside of bot channels
  if (!cM.isWatchingChannel(reaction.message.channel.id)) return;

  return true;
}