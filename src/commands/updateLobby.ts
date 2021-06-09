import { DMChannel, Message, NewsChannel, TextChannel } from "discord.js";
import { Pool } from "mysql2/promise";
import { getLobbyTypeByString, isRoleBasedLobbyType } from "../misc/constants";
import { getNumbersFromString } from "../misc/generics";
import { findLobbyByMessage, updateLobbyPost } from "../misc/lobbyManagement";
import {
  getArguments,
  reactNegative,
  reactPositive,
} from "../misc/messageHelper";
import {
  getBeginnerRolesFromNumbers,
  getRegionalRoleFromString,
} from "../misc/roleManagement";
import { DFZDataBaseClient } from "../types/database/DFZDataBaseClient";
import { Lobby } from "../types/serializables/lobby";
import { LobbySerializer } from "../types/serializers/lobbySerializer";

/**
 * Checks if lobby exists and updates lobby post depending on message
 */
export default async (message: Message, dbClient: DFZDataBaseClient) => {
  try {
    await tryUpdateLobby(message, dbClient);
    reactPositive(message, "Updated lobby parameters.");
  } catch (error) {
    reactNegative(message, error);
  }
};

async function tryUpdateLobby(message: Message, dbClient: DFZDataBaseClient) {
  const lobby = await updateLobbyByMessage(message, dbClient);
  await performLobbyUpdate(lobby, message.channel, dbClient);
}

async function updateLobbyByMessage(
  message: Message,
  dbClient: DFZDataBaseClient
) {
  const args = getUpdateArguments(message);

  const lobbyId = args[0];
  const lobby = await getLobbyById(lobbyId, message.channel.id, dbClient);

  args.shift();
  updateLobbyParameters(args, lobby);
  return lobby;
}

function getUpdateArguments(message: Message) {
  var args = getArguments(message);
  if (args.length == 0)
    throw "No message ID given. \r\n Add the message ID of the lobby you want to update.";

  return args;
}

async function getLobbyById(
  lobbyId: string,
  channelId: string,
  dbClient: DFZDataBaseClient
) {
  var lobby = await findLobbyByMessage(dbClient, channelId, lobbyId);
  if (lobby === undefined) throw `Did not find lobby given the Id ${lobbyId}`;
  return lobby;
}

export function updateLobbyParameters(args: string[], lobby: Lobby) {
  var updateTiers = false,
    updateType = false,
    updateRegion = false,
    changedLobby = false;

  while (args.length > 0) {
    let arg = args[0];
    args.shift();

    if (arg === "-tiers") {
      updateTiers = true;
      continue;
    }

    if (arg === "-type") {
      updateType = true;
      continue;
    }

    if (arg === "-region") {
      updateRegion = true;
      continue;
    }

    if (updateTiers) {
      updateLobbyTiers(lobby, arg);
      changedLobby = true;
      updateTiers = false;
      continue;
    }

    if (updateType) {
      updateLobbyType(lobby, arg);
      changedLobby = true;
      updateType = false;
      continue;
    }

    if (updateRegion) {
      updateLobbyRegion(lobby, arg);
      changedLobby = true;
      updateRegion = false;
      continue;
    }
  }

  if (!changedLobby) throw "You did not make any changes.";
}

function updateLobbyTiers(lobby: Lobby, tiers: string) {
  const minTier = 0;
  const maxTier = 4;
  const numbers = getNumbersFromString(tiers, minTier, maxTier);

  var roles = getBeginnerRolesFromNumbers(numbers);
  if (roles.length === 0) throw "You provided wrong lobby tiers.";

  lobby.beginnerRoleIds = roles;
}

function updateLobbyRegion(lobby: Lobby, region: string) {
  var regionId = getRegionalRoleFromString(region);
  if (regionId == undefined)
    throw `You did not provide a valid region ID. Region IDs are ${getRegionalRoleFromString}`;

  lobby.regionId = regionId;
}

function updateLobbyType(lobby: Lobby, maybeType: string) {
  var lobbyType = getLobbyTypeByString(maybeType);

  const oldIsRoleBased = isRoleBasedLobbyType(lobbyType);
  const newIsRoleBased = isRoleBasedLobbyType(lobby.type);
  if (oldIsRoleBased !== newIsRoleBased)
    throw "Cannot change role based lobby type into simple lobby type and vice versa";

  lobby.type = lobbyType;
}

async function performLobbyUpdate(
  lobby: Lobby,
  channel: TextChannel | DMChannel | NewsChannel,
  dbClient: DFZDataBaseClient
) {
  try {
    const serializer = new LobbySerializer(dbClient);
    await serializer.update(lobby);
    await updateLobbyPost(lobby, channel);
  } catch (e) {
    console.log("Failed updating lobby. Error: " + e);
  }
}
