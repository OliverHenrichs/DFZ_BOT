import { Message } from "discord.js";
import { Pool } from "mysql2/promise";
import { isRoleBasedLobbyType, lobbyTypes, isSimpleLobbyType } from "../misc/constants";
import { postLobby } from "../misc/lobbyManagement";
import { getLobbyType, getLobbyRegionRoleFromMessage, reactNegative, getNumbersFromMessage, getTimeFromMessage, reactPositive } from "../misc/messageHelper";
import { getRegionalRoleStringsForCommand, getBeginnerRolesFromNumbers } from "../misc/roleManagement";
import { Time } from "../misc/timeZone";

/**
 * Checks if lobby exists and posts lobby post depending on lobby type
 * @param {Discord.Message} message coaches message that triggered the lobby post
 * @param {mysql.Pool} dbHandle bot database handle
 */
export default async (message: Message, dbHandle: Pool) => {
  var type = getLobbyType(message);
  if (type == undefined) return;
  // tryout 'region' and role
  var lobbyRegionRole = undefined;
  var beginnerRoleNumbers = [];
  var res: Boolean = false;
  var errormsg: string = "";

  if (isRoleBasedLobbyType(type)) {
    // get region role
    var lobbyRegionRole = getLobbyRegionRoleFromMessage(message, 1);
    if (lobbyRegionRole === undefined)
      return reactNegative(
        message,
        "Failed to recognize region, has to be any of '" +
          getRegionalRoleStringsForCommand().join("', '") +
          "'"
      );

    // get beginner roles
    const minRole = 0;
    const maxRole = 4;
    [res, beginnerRoleNumbers, errormsg] = getNumbersFromMessage(
      message,
      2,
      minRole,
      maxRole
    );
    if (!res) {
      return reactNegative(message, errormsg);
    }
  } else if (
    type === lobbyTypes.replayAnalysis ||
    type === lobbyTypes.meeting
  ) {
    beginnerRoleNumbers = [0, 1, 2, 3, 4];
  } else if (type === lobbyTypes.tryout) {
    beginnerRoleNumbers = [5];
  }

  var lobbyBeginnerRoles = getBeginnerRolesFromNumbers(beginnerRoleNumbers);

  // get zoned time
  const simpleLobbyIndex = 1;
  const roleBasedLobbyIndex = 3;
  const lobbyIndex = isSimpleLobbyType(type)
    ? simpleLobbyIndex
    : roleBasedLobbyIndex;
  var zonedTime: Time;
  [res, zonedTime, errormsg] = getTimeFromMessage(message, lobbyIndex);
  if (!res) {
    return reactNegative(message, errormsg);
  }

  // author is coach
  var coaches: string[] = [message.author.id];

  postLobby(
    dbHandle,
    message.channel,
    coaches,
    type,
    lobbyBeginnerRoles,
    lobbyRegionRole,
    zonedTime
  ).then(() => {
    // react to coach's command
    reactPositive(message);
  });
};
