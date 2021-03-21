import {
  Client,
  Channel,
  GuildMember,
  MessageReaction,
  User,
  Role,
} from "discord.js";
import { DFZDiscordClient } from "../misc/interfaces/DFZDiscordClient";
import { LobbyReactionInfo } from "../misc/messageReactionHelper";
import { Lobby } from "../misc/types/lobby";

const dB = require("../misc/database");
const lM = require("../misc/lobbyManagement");
const mrH = require("../misc/messageReactionHelper");
const uH = require("../misc/userHelper");
const rM = require("../misc/roleManagement");
const cM = require("../misc/channelManagement");
const sM = require("../misc/scheduleManagement");
const c = require("../misc/constants");

/**
 * Adds user to lobby or adds position to user in lobby
 * @param {User} user discord-user
 * @param {int} position dota-position
 * @param {string} beginnerRole player tier role
 * @param {string} regionRole player region role
 * @param {Lobby} lobby lobby player wants to join
 * @param {Channel} channel text channel of lobby
 * @returns true if lobby has been changed, false if not
 */
function addUserOrPosition(
  user: User,
  position: number | string,
  beginnerRole: Role,
  regionRole: string,
  lobby: Lobby,
  channel: Channel
) {
  // check if it contains user
  if (!uH.userExists(lobby, user.id)) {
    // add user
    uH.addUser(
      lobby,
      user.username,
      user.id,
      [position],
      beginnerRole,
      regionRole
    );

    // update lobby post
    lM.updateLobbyPost(lobby, channel);
    return true;
  } else {
    // add position
    var lobbyUser = uH.getUser(lobby, user.id);

    if (!lobbyUser.positions.includes(position)) {
      lobbyUser.positions.push(position);
      lobbyUser.positions.sort();

      // update lobby post
      lM.updateLobbyPost(lobby, channel);
      return true;
    }
  }
  return false;
}

/**
 * Checks if player is suitable beginner, and if, then adds player or adds position according to reaction emoji
 * @param {Lobby} lobby lobby to which the user reacted
 * @param {User} user discord-user
 * @param {MessageReaction} reaction reaction with which the user reacted
 * @param {Role} role role of the user
 * @param {GuildMember} guildMember member of the user
 * @returns true if lobby was changed
 */
function handlePositionEmoji(
  lobby: Lobby,
  user: User,
  reaction: MessageReaction,
  role: Role,
  guildMember: GuildMember
) {
  // dont do tryout
  if (lobby.type === c.lobbyTypes.tryout) return false;

  if (lobby.beginnerRoleIds.find((roleId) => roleId == role.id) === undefined) {
    user.send(
      "⛔ You cannot join because you do not have a suitable beginner role."
    );
    return false;
  }
  // get position
  var position = c.getReactionEmojiPosition(reaction.emoji);
  if (position === 0) return false;

  // get region role
  var regionRole = rM.findRole(guildMember, rM.regionRoleIDs);

  return addUserOrPosition(
    user,
    position,
    role,
    regionRole,
    lobby,
    reaction.message.channel
  );
}

/**
 * Checks if player is tryout, and if, then adds player
 * @param {Lobby} lobby lobby to which the user reacted
 * @param {User} user discord-user
 * @param {MessageReaction} reaction reaction with which the user reacted
 * @param {string} role role of the user
 * @returns true if lobby was changed
 */
function handleSimpleLobbyEmoji(
  lobby: Lobby,
  user: User,
  reaction: MessageReaction,
  role: Role
) {
  if (!c.isSimpleLobbyType(lobby.type)) return false;

  if (lobby.type === c.lobbyTypes.tryout && role.id !== process.env.TRYOUT) {
    user.send("⛔ You cannot join because you do not have the tryout role.");
    return false;
  }

  if (
    lobby.type === c.lobbyTypes.replayAnalysis &&
    rM.tierRoles.find((tr: string) => tr === role.id) === undefined
  ) {
    user.send(
      "⛔ You cannot join because you do not have a beginner role role."
    );
    return false;
  }

  return addUserOrPosition(
    user,
    "-",
    role,
    "",
    lobby,
    reaction.message.channel
  );
}

/**
 * Checks if player is coach, and if, then removes or starts lobby
 * @param {DFZDiscordClient} client
 * @param {Lobby} lobby lobby in question
 * @param {User} user discord-user
 * @param {MessageReaction} reaction reaction with which the user reacted
 * @param {Role} role role of the user
 */
async function handleLobbyManagementEmoji(
  client: DFZDiscordClient,
  lobby: Lobby,
  user: User,
  reaction: MessageReaction,
  role: Role
) {
  if (rM.adminRoles.find((roleId: string) => roleId == role.id) === undefined) {
    user.send("⛔ Only Coaches can use these functions.");
    return;
  }

  if (reaction.emoji.name === "🔒") {
    if (lM.startLobby(client, lobby, user, reaction.message.channel))
      lM.removeLobby(client.dbHandle, lobby);
  } else if (reaction.emoji.name === "❌") {
    await lM.cancelLobbyPost(lobby, reaction.message.channel);
    lM.removeLobby(client.dbHandle, lobby);
    user.send("❌ I cancelled the lobby.");
  } else if (reaction.emoji.name === "🧑‍🏫") {
    lM.addCoach(client.dbHandle, reaction.message.channel, lobby, user.id)
      .then(() => user.send("✅ Added you as a coach!"))
      .catch((error: string) =>
        user.send("⛔ I did not add you as a coach. Reason: " + error)
      );
  }
}

/**
 * Handles reactions that will change existing posted lobbies
 * @param {DFZDiscordClient} client
 * @param {MessageReaction} reaction
 * @param {User} user
 */
async function handleLobbyRelatedEmoji(
  client: DFZDiscordClient,
  reaction: MessageReaction,
  user: User
) {
  const lri: LobbyReactionInfo = await mrH.getInfoFromLobbyReaction(
    client,
    reaction,
    user
  );
  if (
    lri.lobby === undefined ||
    lri.member === undefined ||
    lri.role === undefined
  )
    return;

  var changedLobby: boolean = false;

  // handle adding users
  if (c.isKnownPositionEmoji(reaction.emoji))
    changedLobby = handlePositionEmoji(
      lri.lobby,
      user,
      reaction,
      lri.role,
      lri.member
    );
  else if (c.isKnownSimpleLobbyEmoji(reaction.emoji))
    changedLobby = handleSimpleLobbyEmoji(lri.lobby, user, reaction, lri.role);
  else if (c.isKnownLobbyManagementEmoji(reaction.emoji)) {
    // handle lobby management => will delete lobby if x-ed or started => no need to update => just return
    return handleLobbyManagementEmoji(
      client,
      lri.lobby,
      user,
      reaction,
      lri.role
    );
  }

  if (changedLobby) await dB.updateLobby(client.dbHandle, lri.lobby);
}

/**
 * add reactions handling
 *
 * @param {DFZDiscordClient} client discord client
 * @param {MessageReaction} reaction reaction to handle
 * @param {User} user user who reacted
 */
module.exports = async (
  client: DFZDiscordClient,
  reaction: MessageReaction,
  user: User
) => {
  if (!mrH.isValidLobbyReaction(reaction, user)) return;

  if (cM.scheduleChannels.includes(reaction.message.channel.id))
    return await sM.addCoach(client, reaction, user);

  return await handleLobbyRelatedEmoji(client, reaction, user);
};
