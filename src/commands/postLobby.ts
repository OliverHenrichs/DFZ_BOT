import { Message } from "discord.js";
import { Pool } from "mysql2/promise";
import {
  isRoleBasedLobbyType,
  lobbyTypes,
  isSimpleLobbyType,
  lobbyTypeKeys,
} from "../misc/constants";
import { postLobby } from "../misc/lobbyManagement";
import {
  getLobbyRegionRoleFromMessage,
  reactNegative,
  getNumbersFromMessage,
  getTimeFromMessage,
  reactPositive,
  getLobbyTypeFromMessage,
} from "../misc/messageHelper";
import {
  getRegionalRoleStringsForCommand,
  getBeginnerRolesFromNumbers,
} from "../misc/roleManagement";
import { Time } from "../misc/timeZone";

function reactWrongRegion(message: Message) {
  reactNegative(
    message,
    "Failed to recognize region, has to be any of '" +
      getRegionalRoleStringsForCommand().join("', '") +
      "'"
  );
}

function reactWrongType(message: Message) {
  reactNegative(
    message,
    "Failed to recognize lobby type, has to be any of '" +
      lobbyTypeKeys.join("', '") +
      "'"
  );
}

interface PostLobbyOptions {
  type: number;
  lobbyRegionRole: string;
  beginnerRoles: string[];
  time: Time | undefined;
}

function verifyLobbyType(message: Message, options: PostLobbyOptions) {
  var type = getLobbyTypeFromMessage(message);
  if (type == undefined) {
    reactWrongType(message);
    return false;
  }

  options.type = type;
  return true;
}

function verifyLobbyRegionRole(message: Message, options: PostLobbyOptions) {
  const expectedRegionRolePosition = 1;
  const lobbyRegionRole = getLobbyRegionRoleFromMessage(
    message,
    expectedRegionRolePosition
  );
  if (lobbyRegionRole === undefined) {
    reactWrongRegion(message);
    return false;
  }
  options.lobbyRegionRole = lobbyRegionRole;
  return true;
}

function verifyBeginnerRoleNumbers(
  message: Message,
  options: PostLobbyOptions
) {
  const beginnerRoleNumberIndex = 2; // !postlobby third argument are role numbers
  const minRole = 0;
  const maxRole = 4;
  const numResult = getNumbersFromMessage(
    message,
    beginnerRoleNumberIndex,
    minRole,
    maxRole
  );
  if (!numResult.status || !numResult.numbers) {
    reactNegative(message, numResult.errorMessage);
    return false;
  }
  options.beginnerRoles = getBeginnerRolesFromNumbers(numResult.numbers);
  return true;
}

function verifyLobbyTime(message: Message, options: PostLobbyOptions) {
  // time is at different position in message args dependent on the lobby type
  const simpleLobbyIndex = 1;
  const roleBasedLobbyIndex = 3;
  const lobbyIndex = isSimpleLobbyType(options.type)
    ? simpleLobbyIndex
    : roleBasedLobbyIndex;

  const timeRes = getTimeFromMessage(message, lobbyIndex);
  if (timeRes.error !== "" || timeRes.time === undefined) {
    reactNegative(message, timeRes.error);
    return false;
  }
  options.time = timeRes.time;
  return true;
}

function setLobbyTypeBasedOptions(message: Message, options: PostLobbyOptions) {
  if (isRoleBasedLobbyType(options.type)) {
    // complex lobby type with region and specific beginner roles
    if (!verifyLobbyRegionRole(message, options)) return false;
    if (!verifyBeginnerRoleNumbers(message, options)) return false;
  } else {
    // other lobby types that are more open
    if (
      options.type === lobbyTypes.replayAnalysis ||
      options.type === lobbyTypes.meeting
    ) {
      options.beginnerRoles = getBeginnerRolesFromNumbers(
        new Set([0, 1, 2, 3, 4])
      );
    } else if (options.type === lobbyTypes.tryout) {
      options.beginnerRoles = getBeginnerRolesFromNumbers(new Set([5]));
    }
  }

  return true;
}

function setPostLobbyOptions(message: Message): PostLobbyOptions | undefined {
  var options: PostLobbyOptions = {
    type: -1,
    lobbyRegionRole: "",
    beginnerRoles: [],
    time: undefined,
  };

  if (!verifyLobbyType(message, options)) return undefined;
  if (!setLobbyTypeBasedOptions(message, options)) return undefined;
  if (!verifyLobbyTime(message, options)) return undefined;

  return options;
}

/**
 * Checks if lobby exists and posts lobby post depending on lobby type
 * @param {Discord.Message} message coaches message that triggered the lobby post
 * @param {mysql.Pool} dbHandle bot database handle
 */
export default async (message: Message, dbHandle: Pool) => {
  var options = setPostLobbyOptions(message);
  if (options === undefined || options.time === undefined) return;

  // author is coach
  var coaches: string[] = [message.author.id];

  postLobby(
    dbHandle,
    message.channel,
    coaches,
    options.type,
    options.beginnerRoles,
    options.lobbyRegionRole,
    options.time
  ).then(() => {
    reactPositive(message);
  });
};
