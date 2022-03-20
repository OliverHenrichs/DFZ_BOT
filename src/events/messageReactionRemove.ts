import { MessageReaction, User } from "discord.js";
import { ChannelManager } from "../logic/discord/DFZChannelManager";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";
import { adminRoles } from "../logic/discord/RoleManagement";
import { ScheduleManipulator } from "../logic/scheduling/ScheduleManipulator";
import { Lobby } from "../logic/serializables/Lobby";
import {
  isSimpleLobbyType,
  lobbyManagementReactionEmojis,
  tryoutReactionEmoji,
} from "../misc/constants";
import {
  getInfoFromLobbyReaction,
  isValidLobbyReaction,
  LobbyReactionInfo,
} from "../misc/messageReactionHelper";

async function tryCancelLobbyCancel(
  client: DFZDiscordClient,
  lobby: Lobby,
  user: User
) {
  const timeout = client.timeouts.find(
    (timeout) => timeout.lobby.messageId === lobby.messageId
  );
  if (timeout) {
    clearTimeout(timeout.timeout);
    await user.send("✅ I will no longer cancel the lobby.");
  }
}

async function handleCoachReaction(
  client: DFZDiscordClient,
  reaction: MessageReaction,
  lobby: Lobby,
  user: User
) {
  if (reaction.message.channel.type === "DM") {
    return;
  }

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
      await tryCancelLobbyCancel(client, lobby, user);
      break;

    case tryoutReactionEmoji:
      if (isSimpleLobbyType(lobby.type))
        await lobby.updatePlayerInLobbyDueToReactionRemoval(
          client.dbClient,
          reaction,
          user
        );
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
    await handleCoachReaction(client, reaction, lri.lobby, user);
  else
    await lri.lobby.updatePlayerInLobbyDueToReactionRemoval(
      client.dbClient,
      reaction,
      user
    );
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
    await ScheduleManipulator.removeCoachFromSchedule({
      client,
      reaction,
      user,
    });
  else await handleLobbyRelatedEmoji(client, reaction, user);
}
