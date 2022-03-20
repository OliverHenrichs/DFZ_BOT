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
} from "../logic/discord/RoleManagement";
import { LobbyPostManipulator } from "../logic/lobby/LobbyPostManipulator";
import { LobbyStarter } from "../logic/lobby/LobbyStarter";
import { ScheduleManipulator } from "../logic/scheduling/ScheduleManipulator";
import { Lobby } from "../logic/serializables/Lobby";
import { LobbySerializer } from "../logic/serializers/LobbySerializer";
import { SerializeUtils } from "../logic/serializers/SerializeUtils";
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
import { savePlayerParticipation } from "../misc/tracker";
import { addUser } from "../misc/userHelper";

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
    return await ScheduleManipulator.addCoachToSchedule({
      client,
      reaction,
      user,
    });

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

  let changedLobby: boolean = false;

  // handle adding users
  if (isKnownPositionEmoji(reaction.emoji))
    changedLobby = await handlePositionEmoji(
      lri.lobby,
      user,
      reaction,
      lri.role,
      lri.member
    );
  else if (isKnownSimpleLobbyEmoji(reaction.emoji))
    changedLobby = await handleSimpleLobbyEmoji(
      lri.lobby,
      user,
      reaction,
      lri.role
    );
  else if (isKnownLobbyManagementEmoji(reaction.emoji)) {
    // handle lobby management => will delete lobby if x-ed or started => no need to update => just return
    return await handleLobbyManagementEmoji(
      client,
      lri.lobby,
      user,
      reaction,
      lri.role
    );
  }

  if (changedLobby) {
    const gdbc = SerializeUtils.getGuildDBClient(
      lri.lobby.guildId,
      client.dbClient
    );
    const serializer = new LobbySerializer(gdbc);
    serializer.update(lri.lobby);
  }
}

/**
 * Adds user to lobby or adds position to user in lobby
 * @param user discord-user
 * @param position dota-position
 * @param beginnerRole player tier role
 * @param regionRole player region role
 * @param lobby lobby player wants to join
 * @param channel text channel of lobby
 * @returns true if lobby has been changed, false if not
 */
async function addUserOrPosition(
  user: User,
  position: number,
  beginnerRole: Role,
  regionRole: Role | undefined,
  lobby: Lobby,
  channel: TextBasedChannels
): Promise<boolean> {
  const userIdx = lobby.getUserIndex(user.id);
  if (userIdx === -1) {
    addUser(
      lobby,
      user.username,
      user.id,
      [position],
      beginnerRole,
      regionRole
    );
    await LobbyPostManipulator.tryUpdateLobbyPost(lobby, channel);
    return true;
  } else {
    const lobbyUser = lobby.users[userIdx];
    if (!lobbyUser.positions.includes(position)) {
      lobbyUser.positions.push(position);
      lobbyUser.positions.sort();
      await LobbyPostManipulator.tryUpdateLobbyPost(lobby, channel);
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
async function handlePositionEmoji(
  lobby: Lobby,
  user: User,
  reaction: MessageReaction,
  role: Role,
  guildMember: GuildMember
) {
  if (isSimpleLobbyType(lobby.type)) return false;

  if (hasLobbyBeginnerRole(lobby, role)) {
    await user.send(
      "⛔ You cannot join because you do not have a suitable beginner role."
    );
    return false;
  }

  const position = getReactionEmojiPosition(reaction.emoji);
  if (position === 0) return false;

  const regionRole = findRole(guildMember, RegionDefinitions.regionRoles);

  return await addUserOrPosition(
    user,
    position,
    role,
    regionRole,
    lobby,
    reaction.message.channel
  );
}

function hasLobbyBeginnerRole(lobby: Lobby, role: Role) {
  return (
    lobby.beginnerRoleIds.find((roleId) => roleId == role.id) !== undefined
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
async function handleSimpleLobbyEmoji(
  lobby: Lobby,
  user: User,
  reaction: MessageReaction,
  role: Role
): Promise<boolean> {
  if (!isSimpleLobbyType(lobby.type)) return false;

  if (lobby.type === lobbyTypes.tryout && role.id !== process.env.TRYOUT) {
    await user.send(
      "⛔ You cannot join because you do not have the tryout role."
    );
    return false;
  }

  if (
    lobby.type === lobbyTypes.replayAnalysis &&
    beginnerRoles.find((tr: string) => tr === role.id) === undefined
  ) {
    await user.send(
      "⛔ You cannot join because you do not have a beginner role."
    );
    return false;
  }

  return await addUserOrPosition(
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
    lobby.guildId,
    lobby.users,
    lobby.type,
    getPlayersPerLobbyByLobbyType(lobby.type)
  );

  const gdbc = SerializeUtils.getGuildDBClient(lobby.guildId, client.dbClient);
  const serializer = new LobbySerializer(gdbc);
  await serializer.delete([lobby]);
}

async function handleLobbyStart(
  client: DFZDiscordClient,
  lobby: Lobby,
  channel: TextBasedChannels,
  user: User
) {
  if (lobby.started) {
    if (lobby.users.length > 0) {
      LobbyPostManipulator.writeLobbyStartPost(lobby, channel);
    }
    return;
  }

  const lobbyInteractor = new LobbyStarter(client, lobby);
  if (await lobbyInteractor.tryStartLobby(user, channel))
    await removeLobbyDelayed(lobby, client);
}

async function handleLobbyCancel(
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
  await user.send(
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
  const gdbc = SerializeUtils.getGuildDBClient(lobby.guildId, client.dbClient);
  const serializer = new LobbySerializer(gdbc);
  serializer.delete([lobby]);
  await user.send("❌ I cancelled the lobby.");
  return;
}

async function handleCoachAdd(
  client: DFZDiscordClient,
  lobby: Lobby,
  channel: TextBasedChannels,
  user: User
) {
  try {
    await lobby.addCoach(client.dbClient, channel, user.id);
    await user.send("✅ Added you as a coach!");
  } catch (e) {
    await user.send("⛔ I did not add you as a coach. Reason: " + e);
  }
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
    await user.send("⛔ Only Coaches can use these functions.");
    return;
  }

  // Ignore DMs to pacify typescript...
  const channel = reaction.message.channel;
  if (channel.type === "DM") {
    return;
  }

  switch (reaction.emoji.name) {
    case "🔒":
      return await handleLobbyStart(client, lobby, channel, user);
    case "❌":
      return await handleLobbyCancel(client, lobby, channel, user);
    case "🧑‍🏫":
      return await handleCoachAdd(client, lobby, channel, user);
    default:
      break;
  }
}
