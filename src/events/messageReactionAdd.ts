import {
  GuildMember,
  MessageReaction,
  Role,
  TextBasedChannels,
  User,
} from "discord.js";
import { ChannelManager } from "../logic/discord/DFZChannelManager";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";
import {
  adminRoles,
  beginnerRoles,
  findRole,
} from "../logic/discord/roleManagement";
import { LobbyPostManipulator } from "../logic/lobby/LobbyPostManipulator";
import { LobbyStarter } from "../logic/lobby/LobbyStarter";
import { Lobby } from "../logic/serializables/lobby";
import { LobbySerializer } from "../logic/serializers/lobbySerializer";
import { RegionDefinitions } from "../logic/time/RegionDefinitions";
import { TimeConverter } from "../logic/time/TimeConverter";
import {
  getPlayersPerLobbyByLobbyType,
  getReactionEmojiPosition,
  isKnownLobbyManagementEmoji,
  isKnownPositionEmoji,
  isKnownSimpleLobbyEmoji,
  isSimpleLobbyType,
  lobbyTypes,
} from "../misc/constants";
import {
  getInfoFromLobbyReaction,
  isValidLobbyReaction,
  LobbyReactionInfo,
} from "../misc/messageReactionHelper";
import { addCoachToSchedule } from "../misc/scheduleManagement";
import { savePlayerParticipation } from "../misc/tracker";
import { addUser, getUserIndex } from "../misc/userHelper";

module.exports = async (
  client: DFZDiscordClient,
  reaction: MessageReaction,
  user: User
) => {
  try {
    await handleMessageReactionAdd(client, reaction, user);
  } catch (error) {
    console.log(`Error while handling message reaction add: ${error}`);
  }
};

async function handleMessageReactionAdd(
  client: DFZDiscordClient,
  reaction: MessageReaction,
  user: User
) {
  if (!isValidLobbyReaction(reaction, user)) return;

  if (ChannelManager.scheduleChannels.includes(reaction.message.channel.id))
    return await addCoachToSchedule(client, reaction, user);

  return await handleLobbyRelatedEmoji(client, reaction, user);
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
  const lri: LobbyReactionInfo = await getInfoFromLobbyReaction(
    client,
    reaction,
    user
  );

  var changedLobby: boolean = false;

  // handle adding users
  if (isKnownPositionEmoji(reaction.emoji))
    changedLobby = handlePositionEmoji(
      lri.lobby,
      user,
      reaction,
      lri.role,
      lri.member
    );
  else if (isKnownSimpleLobbyEmoji(reaction.emoji))
    changedLobby = handleSimpleLobbyEmoji(lri.lobby, user, reaction, lri.role);
  else if (isKnownLobbyManagementEmoji(reaction.emoji)) {
    // handle lobby management => will delete lobby if x-ed or started => no need to update => just return
    return handleLobbyManagementEmoji(
      client,
      lri.lobby,
      user,
      reaction,
      lri.role
    );
  }

  if (changedLobby) {
    const serializer = new LobbySerializer(client.dbClient);
    serializer.update(lri.lobby);
  }
}

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
  position: number,
  beginnerRole: Role,
  regionRole: Role | undefined,
  lobby: Lobby,
  channel: TextBasedChannels
) {
  var userIdx = getUserIndex(lobby, user.id);
  // check if it contains user
  if (userIdx === -1) {
    // add user
    addUser(
      lobby,
      user.username,
      user.id,
      [position],
      beginnerRole,
      regionRole
    );

    // update lobby post
    LobbyPostManipulator.tryUpdateLobbyPost(lobby, channel);
    return true;
  } else {
    // add position
    var lobbyUser = lobby.users[userIdx];

    if (!lobbyUser.positions.includes(position)) {
      lobbyUser.positions.push(position);
      lobbyUser.positions.sort();

      // update lobby post
      LobbyPostManipulator.tryUpdateLobbyPost(lobby, channel);
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
  if (isSimpleLobbyType(lobby.type)) return false;

  if (lobby.beginnerRoleIds.find((roleId) => roleId == role.id) === undefined) {
    user.send(
      "⛔ You cannot join because you do not have a suitable beginner role."
    );
    return false;
  }
  // get position
  var position = getReactionEmojiPosition(reaction.emoji);
  if (position === 0) return false;

  // get region role
  var regionRole = findRole(guildMember, RegionDefinitions.regionRoles);

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
  if (!isSimpleLobbyType(lobby.type)) return false;

  if (lobby.type === lobbyTypes.tryout && role.id !== process.env.TRYOUT) {
    user.send("⛔ You cannot join because you do not have the tryout role.");
    return false;
  }

  if (
    lobby.type === lobbyTypes.replayAnalysis &&
    beginnerRoles.find((tr: string) => tr === role.id) === undefined
  ) {
    user.send("⛔ You cannot join because you do not have a beginner role.");
    return false;
  }

  return addUserOrPosition(
    user,
    -1,
    role,
    undefined,
    lobby,
    reaction.message.channel
  );
}

async function removeLobbyDelayed(lobby: Lobby, client: DFZDiscordClient) {
  setTimeout(handleLobbyStarted, TimeConverter.hToMs, lobby, client);
}

async function handleLobbyStarted(lobby: Lobby, client: DFZDiscordClient) {
  await savePlayerParticipation(
    client,
    lobby.users,
    lobby.type,
    getPlayersPerLobbyByLobbyType(lobby.type)
  );

  const serializer = new LobbySerializer(client.dbClient);
  await serializer.delete([lobby]);
}

function handleLobbyStart(
  client: DFZDiscordClient,
  lobby: Lobby,
  channel: TextBasedChannels,
  user: User
) {
  if (lobby.started) {
    LobbyPostManipulator.writeLobbyStartPost(lobby, channel);
    return;
  }

  const lobbyInteractor = new LobbyStarter(client, lobby);
  lobbyInteractor.tryStartLobby(user, channel).then((hasStarted) => {
    if (hasStarted) removeLobbyDelayed(lobby, client);
  });
}

function handleLobbyCancel(
  client: DFZDiscordClient,
  lobby: Lobby,
  channel: TextBasedChannels,
  user: User
) {
  const to = setTimeout(
    removeLobbyPermantently,
    2 * TimeConverter.minToMs,
    client,
    lobby,
    channel,
    user
  );
  client.timeouts.push({ lobby: lobby, timeout: to });
  user.send(
    "I will cancel the lobby in 2 minutes. Press ❌ again to cancel the cancellation"
  );
}

async function removeLobbyPermantently(
  client: DFZDiscordClient,
  lobby: Lobby,
  channel: TextBasedChannels,
  user: User
) {
  await LobbyPostManipulator.cancelLobbyPost(lobby, channel);
  const serializer = new LobbySerializer(client.dbClient);
  serializer.delete([lobby]);
  user.send("❌ I cancelled the lobby.");
  return;
}

function handleCoachAdd(
  client: DFZDiscordClient,
  lobby: Lobby,
  channel: TextBasedChannels,
  user: User
) {
  lobby
    .addCoach(client.dbClient, channel, user.id)
    .then(() => user.send("✅ Added you as a coach!"))
    .catch((error: string) =>
      user.send("⛔ I did not add you as a coach. Reason: " + error)
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
  if (adminRoles.find((roleId: string) => roleId == role.id) === undefined) {
    user.send("⛔ Only Coaches can use these functions.");
    return;
  }

  // Ignore DMs to pacify typescript...
  const channel = reaction.message.channel;
  if (channel.type === "DM") {
    return;
  }

  switch (reaction.emoji.name) {
    case "🔒":
      return handleLobbyStart(client, lobby, channel, user);
    case "❌":
      return handleLobbyCancel(client, lobby, channel, user);
    case "🧑‍🏫":
      return handleCoachAdd(client, lobby, channel, user);
    default:
      break;
  }
}
