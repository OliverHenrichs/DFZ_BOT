import { DMChannel, Message, NewsChannel, TextChannel } from "discord.js";
import { Pool } from "mysql2/promise";
import { getLobbyTypeByString, isRoleBasedLobbyType } from "../misc/constants";
import { updateLobby } from "../misc/database";
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
import { Lobby } from "../misc/types/lobby";

/**
 * Checks if lobby exists and updates lobby post depending on message
 * @param {Message} message coaches message that triggered the lobby update
 * @param {Pool} dbHandle bot database handle
 */
export default async (message: Message, dbHandle: Pool) => {
  try {
    await tryUpdateLobby(message, dbHandle);
    reactPositive(message, "Updated lobby parameters.");
  } catch (error) {
    reactNegative(message, error);
  }
};

async function tryUpdateLobby(message: Message, dbHandle: Pool) {
  const lobby = await updateLobbyByMessage(message, dbHandle);
  await performLobbyUpdate(lobby, message.channel, dbHandle);
}

async function updateLobbyByMessage(message: Message, dbHandle: Pool) {
  const args = getUpdateArguments(message);

  const lobbyId = args[0];
  const lobby = await getLobbyById(lobbyId, message.channel.id, dbHandle);

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
  dbHandle: Pool
) {
  var lobby = await findLobbyByMessage(dbHandle, channelId, lobbyId);
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
  dbHandle: Pool
) {
  try {
    await updateLobby(dbHandle, lobby);
    await updateLobbyPost(lobby, channel);
  } catch (e) {
    console.log("Failed updating lobby. Error: " + e);
  }
}
