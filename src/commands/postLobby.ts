import { Message } from "discord.js";
import { Pool } from "mysql2/promise";
import {
  isRoleBasedLobbyType,
  lobbyTypes,
  isSimpleLobbyType,
} from "../misc/constants";
import { postLobby, PostLobbyOptions } from "../misc/lobbyManagement";
import {
  getLobbyRegionRoleFromMessage,
  reactNegative,
  getNumbersFromMessage,
  getTimeFromMessage,
  reactPositive,
  getLobbyTypeFromMessage,
  getArguments,
} from "../misc/messageHelper";
import {
  getBeginnerRolesFromNumbers,
  adminRoles,
  beginnerRoles,
} from "../misc/roleManagement";

/**
 * Checks if lobby exists and posts lobby post depending on lobby type
 * @param {Discord.Message} message coaches message that triggered the lobby post
 * @param {mysql.Pool} dbHandle bot database handle
 */
export default async (message: Message, dbHandle: Pool) => {
  var options = getPostLobbyOptions(message);
  if (options === undefined) return;

  postLobby(dbHandle, message.channel, options).then(() => {
    reactPositive(message);
  });
};

function getPostLobbyOptions(message: Message): PostLobbyOptions | undefined {
  try {
    return tryGetLobbyOptionsFromMessage(message);
  } catch (e) {
    reactNegative(message, e);
    return undefined;
  }
}

function tryGetLobbyOptionsFromMessage(message: Message): PostLobbyOptions {
  const type = getLobbyTypeFromMessage(message);
  const time = getLobbyTime(message, type);

  var options: PostLobbyOptions = {
    type: type,
    regionRole: "",
    userRoles: [],
    time: time,
    coaches: [message.author.id],
    optionalText: "",
  };
  setLobbyTypeBasedOptions(message, options);

  return options;
}

function getLobbyTime(message: Message, type: number) {
  const lobbyIndex = getLobbyTypeBasedTimeIndex(type);
  const timeResult = getTimeFromMessage(message, lobbyIndex);
  return timeResult.time;
}

function getLobbyTypeBasedTimeIndex(lobbyType: number) {
  const simpleLobbyIndex = 1;
  const roleBasedLobbyIndex = 3;
  return isSimpleLobbyType(lobbyType) ? simpleLobbyIndex : roleBasedLobbyIndex;
}

function setLobbyTypeBasedOptions(message: Message, options: PostLobbyOptions) {
  if (isRoleBasedLobbyType(options.type)) {
    setRoleBasedLobbyOptions(message, options);
  } else {
    setNonRoleBasedLobbyOptions(message, options);
  }
}

function setRoleBasedLobbyOptions(message: Message, options: PostLobbyOptions) {
  options.regionRole = getLobbyRegionRole(message);
  options.userRoles = getAllowedTiers(message);
}

function getLobbyRegionRole(message: Message) {
  const argIndex = 1;
  return getLobbyRegionRoleFromMessage(message, argIndex);
}

function getAllowedTiers(message: Message) {
  const rolesIdxInMessage = 2;
  const minRole = 0;
  const maxRole = 4;
  const numbers = getNumbersFromMessage(
    message,
    rolesIdxInMessage,
    minRole,
    maxRole
  );
  return getBeginnerRolesFromNumbers(numbers);
}

function setNonRoleBasedLobbyOptions(
  message: Message,
  options: PostLobbyOptions
) {
  switch (options.type) {
    case lobbyTypes.replayAnalysis:
      setReplayAnalysisOptions(options);
      break;
    case lobbyTypes.tryout:
      setTryoutOptions(options);
      break;
    case lobbyTypes.meeting:
      setMeetingOptions(message, options);
      break;
    default:
      options.userRoles = beginnerRoles.concat(adminRoles);
  }
}

function setReplayAnalysisOptions(options: PostLobbyOptions) {
  options.userRoles = beginnerRoles;
}

function setTryoutOptions(options: PostLobbyOptions) {
  const tryoutRoleNumber = 5;
  options.userRoles = getBeginnerRolesFromNumbers(new Set([tryoutRoleNumber]));
}

function setMeetingOptions(message: Message, options: PostLobbyOptions) {
  const args = getArguments(message);
  setAllowedUserRoles(args, options);
  trySetOptionalText(args, options);
}

function setAllowedUserRoles(args: string[], options: PostLobbyOptions) {
  options.userRoles = beginnerRoles.concat(adminRoles);

  const inviteeIndex = 3;
  if (args.length > inviteeIndex)
    trySetMeetingForPlayersOrCoaches(args[inviteeIndex], options);
}

function trySetMeetingForPlayersOrCoaches(
  inviteeString: string,
  options: PostLobbyOptions
) {
  if (inviteeString === "coaches") options.userRoles = adminRoles;
  else if (inviteeString === "players") options.userRoles = beginnerRoles;
}

function trySetOptionalText(args: string[], options: PostLobbyOptions) {
  if (args.length > 4) options.optionalText = args.slice(4).join(" ");
}
