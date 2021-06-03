import { Message } from "discord.js";
import { Pool } from "mysql2/promise";
import { updateLobby } from "../misc/database";
import { findLobbyByMessage, updateLobbyPost } from "../misc/lobbyManagement";
import {
  getArguments,
  reactNegative,
  reactPositive,
} from "../misc/messageHelper";
import { Lobby } from "../misc/types/lobby";

/**
 * Kicks a player
 * @param {Message} message coaches message that triggered the kick
 * @param {Pool} dbHandle bot database handle
 */
export default async (message: Message, dbHandle: Pool) => {
  try {
    const kickSpecifics = await getKickSpecificsFromMessage(message, dbHandle);
    await kickPlayerFromLobby(kickSpecifics, message, dbHandle);
  } catch (err) {
    console.log(`Error updating lobby after kicking: ${err}`);
  }
};

async function getKickSpecificsFromMessage(
  message: Message,
  dbHandle: Pool
): Promise<KickSpecifics> {
  return new Promise<KickSpecifics>(async (resolve, reject) => {
    try {
      const kickArguments = getKickArguments(message);
      const lobby = await getKickLobby(
        message,
        dbHandle,
        kickArguments.messageId
      );
      const kickeeIndex = await getKickeeIndex(lobby, kickArguments.userId);
      resolve({ lobby: lobby, kickeeIndex: kickeeIndex });
    } catch (errorMessage) {
      reactNegative(message, errorMessage);
      reject("Could not get lobby or player.");
    }
  });
}

interface KickSpecifics {
  lobby: Lobby;
  kickeeIndex: number;
}

function getKickArguments(message: Message): KickArguments {
  var args = getArguments(message);
  if (args.length !== 2) {
    throw `Give two arguments:
        1) message ID of the lobby you want to kick someone from and 
        2) the player's ID.`;
  }
  return { messageId: args[0], userId: args[1] };
}

interface KickArguments {
  messageId: string;
  userId: string;
}

async function getKickLobby(
  message: Message,
  dbHandle: Pool,
  messageId: string
): Promise<Lobby> {
  return new Promise<Lobby>(async (resolve, reject) => {
    var lobby = await findLobbyByMessage(
      dbHandle,
      message.channel.id,
      messageId
    );
    if (lobby === undefined) {
      return reject("Did not find lobby given the Id.");
    }
    return resolve(lobby);
  });
}

function getKickeeIndex(lobby: Lobby, userId: string) {
  const kickeeIdx = lobby.users.findIndex((usr) => usr.id === userId);
  if (kickeeIdx === -1) throw "Did not find player to be kicked given the Id.";
  return kickeeIdx;
}

async function kickPlayerFromLobby(
  kickSpecifics: KickSpecifics,
  message: Message,
  dbHandle: Pool
) {
  kickSpecifics.lobby.users.splice(kickSpecifics.kickeeIndex, 1);
  await updateLobby(dbHandle, kickSpecifics.lobby);
  await updateLobbyPost(kickSpecifics.lobby, message.channel);
  reactPositive(message, "Kicked player.");
}
