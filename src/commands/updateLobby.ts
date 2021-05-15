import { Message } from "discord.js";
import { Pool } from "mysql2/promise";
import { updateLobby } from "../misc/database";
import {
  findLobbyByMessage,
  updateLobbyParameters,
  updateLobbyPost,
} from "../misc/lobbyManagement";
import {
  getArguments,
  reactNegative,
  reactPositive,
} from "../misc/messageHelper";

/**
 * Checks if lobby exists and updates lobby post depending on message
 * @param {Message} message coaches message that triggered the lobby update
 * @param {Pool} dbHandle bot database handle
 */
export default async (message: Message, dbHandle: Pool) => {
  var args = getArguments(message);

  if (args.length == 0) {
    reactNegative(
      message,
      "No message ID given. \r\n Add the message ID of the lobby you want to update."
    );
    return;
  }

  var lobby = await findLobbyByMessage(dbHandle, message.channel.id, args[0]);
  if (lobby === undefined) {
    reactNegative(message, "Did not find lobby given the Id.");
    return;
  }

  // remove message ID from args
  args.shift();

  const lobbyUpdateResult = updateLobbyParameters(args, lobby);
  if (!lobbyUpdateResult.success)
    return reactNegative(
      message,
      "Failed updating lobby parameters: " + lobbyUpdateResult.errorMessage
    );

  try {
    await updateLobby(dbHandle, lobby);
    await updateLobbyPost(lobby, message.channel);
    await reactPositive(message, "Updated lobby parameters.");
  } catch (e) {
    console.log("Failed updating lobby. Error: " + e);
  }
};
