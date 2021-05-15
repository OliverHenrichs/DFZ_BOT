import { MessageReaction, User } from "discord.js";
import { scheduleChannels } from "../misc/channelManagement";
import { lobbyManagementReactionEmojis } from "../misc/constants";
import { DFZDiscordClient } from "../misc/types/DFZDiscordClient";
import { removeCoach, updatePlayerInLobby } from "../misc/lobbyManagement";
import { Pool } from "mysql2/promise";
import {
  getInfoFromLobbyReaction,
  isValidLobbyReaction,
  LobbyReactionInfo,
} from "../misc/messageReactionHelper";
import { adminRoles } from "../misc/roleManagement";
import { removeCoachFromSchedule } from "../misc/scheduleManagement";
import { Lobby } from "../misc/types/lobby";

function handleCoachReaction(
  dbHandle: Pool,
  reaction: MessageReaction,
  lobby: Lobby,
  user: User
) {
  if (reaction.emoji.name !== lobbyManagementReactionEmojis[2]) return;
  if (reaction.message.channel.type === "dm") return;

  removeCoach(dbHandle, reaction.message.channel, lobby, user.id)
    .then(() => user.send("✅ Removed you as a coach!"))
    .catch((error: string) =>
      user.send("⛔ I could not remove you as a coach. Reason: " + error)
    );
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
  const lri: LobbyReactionInfo | undefined = await getInfoFromLobbyReaction(
    client,
    reaction,
    user
  );
  if (!lri) return;

  if (adminRoles.includes(lri.role.id))
    handleCoachReaction(client.dbHandle, reaction, lri.lobby, user);
  else updatePlayerInLobby(client.dbHandle, reaction, lri.lobby, user);
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
  if (!isValidLobbyReaction(reaction, user)) return;

  if (scheduleChannels.includes(reaction.message.channel.id)) {
    removeCoachFromSchedule(client, reaction, user);
  } else {
    await handleLobbyRelatedEmoji(client, reaction, user);
  }
};
