import { MessageReaction, User } from "discord.js";
import { DFZDiscordClient } from "../misc/interfaces/DFZDiscordClient";
import { LobbyReactionInfo } from "../misc/messageReactionHelper";

const lM = require("../misc/lobbyManagement");
const cM = require("../misc/channelManagement");
const c = require("../misc/constants");
const mrH = require("../misc/messageReactionHelper");
const rM = require("../misc/roleManagement");
const sM = require("../misc/scheduleManagement");

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

  if (
    rM.adminRoles.includes(lri.role.id) &&
    reaction.emoji.name === c.lobbyManagementReactionEmojis[2]
  ) {
    lM.removeCoach(
      client.dbHandle,
      reaction.message.channel,
      lri.lobby,
      user.id
    )
      .then(() => user.send("✅ Removed you as a coach!"))
      .catch((error: string) =>
        user.send("⛔ I could not remove you as a coach. Reason: " + error)
      );
  } // if not admin, then it was a user
  else lM.updatePlayerInLobby(client.dbHandle, reaction, lri.lobby, user);
}

/**
 * remove reactions handling
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

  if (cM.scheduleChannels.includes(reaction.message.channel.id)) {
    sM.removeCoachFromSchedule(client, reaction, user);
  } else {
    await handleLobbyRelatedEmoji(client, reaction, user);
  }
};
