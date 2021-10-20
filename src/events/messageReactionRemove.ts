import { MessageReaction, User } from "discord.js";
import { ChannelManager } from "../logic/discord/ChannelManager";
import { lobbyManagementReactionEmojis } from "../misc/constants";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";
import {
  getInfoFromLobbyReaction,
  isValidLobbyReaction,
  LobbyReactionInfo,
} from "../misc/messageReactionHelper";
import { adminRoles } from "../logic/discord/roleManagement";
import { removeCoachFromSchedule } from "../misc/scheduleManagement";
import { Lobby } from "../logic/serializables/lobby";

function tryCancelLobbyCancel(
  client: DFZDiscordClient,
  lobby: Lobby,
  user: User
) {
  const timeout = client.timeouts.find(
    (timeout) => timeout.lobby.messageId === lobby.messageId
  );
  if (timeout) {
    clearTimeout(timeout.timeout);
    user.send("✅ I will no longer cancel the lobby.");
  }
}

function handleCoachReaction(
  client: DFZDiscordClient,
  reaction: MessageReaction,
  lobby: Lobby,
  user: User
) {
  if (reaction.message.channel.type === "DM") return;

  switch (reaction.emoji.name) {
    case lobbyManagementReactionEmojis[2]:
      lobby
        .removeCoach(client.dbClient, reaction.message.channel, user.id)
        .then(() => user.send("✅ Removed you as a coach!"))
        .catch((error: string) =>
          user.send("⛔ I could not remove you as a coach. Reason: " + error)
        );
      break;

    case lobbyManagementReactionEmojis[1]:
      tryCancelLobbyCancel(client, lobby, user);
      break;
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
  const lri: LobbyReactionInfo | undefined = await getInfoFromLobbyReaction(
    client,
    reaction,
    user
  );

  if (adminRoles.includes(lri.role.id))
    handleCoachReaction(client, reaction, lri.lobby, user);
  else lri.lobby.updatePlayerInLobby(client.dbClient, reaction, user);
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
  try {
    await handleMessageReactionRemove(client, reaction, user);
  } catch (error) {
    console.log(`Error while handling message reaction add: ${error}`);
  }
};

async function handleMessageReactionRemove(
  client: DFZDiscordClient,
  reaction: MessageReaction,
  user: User
) {
  if (!isValidLobbyReaction(reaction, user)) return;

  if (ChannelManager.scheduleChannels.includes(reaction.message.channel.id))
    removeCoachFromSchedule(client, reaction, user);
  else await handleLobbyRelatedEmoji(client, reaction, user);
}
