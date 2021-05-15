import { Message } from "discord.js";
import { Pool } from "mysql2/promise";
import { updateLobby } from "../misc/database";
import { findLobbyByMessage, updateLobbyPost } from "../misc/lobbyManagement";
import {
  getArguments,
  reactNegative,
  reactPositive,
} from "../misc/messageHelper";

/**
 * Kicks a player
 * @param {Message} message coaches message that triggered the kick
 * @param {Pool} dbHandle bot database handle
 */
export default async (message: Message, dbHandle: Pool) => {
  var args = getArguments(message);

  if (args.length !== 2) {
    reactNegative(
      message,
      `Give two arguments:
      1) message ID of the lobby you want to kick someone from and 
      2) the player's ID.`
    );
    return;
  }

  var lobby = await findLobbyByMessage(dbHandle, message.channel.id, args[0]);
  if (lobby === undefined) {
    reactNegative(message, "Did not find lobby given the Id.");
    return;
  }

  const kickeeIdx = lobby.users.findIndex((usr) => usr.id === args[1]);
  if (kickeeIdx === -1) {
    reactNegative(message, "Did not find player to be kicked given the Id.");
    return;
  }
  lobby.users.splice(kickeeIdx, 1);

  try {
    await updateLobby(dbHandle, lobby);
    await updateLobbyPost(lobby, message.channel);
    await reactPositive(message, "Kicked player.");
  } catch (err) {
    console.log(`Error updating lobby after kicking: ${err}`);
  }
};
