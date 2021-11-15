import { Message, TextBasedChannels } from "discord.js";
import { DFZDataBaseClient } from "../logic/database/DFZDataBaseClient";
import { LobbyPostManipulator } from "../logic/lobby/LobbyPostManipulator";
import { Lobby } from "../logic/serializables/lobby";
import { LobbySerializer } from "../logic/serializers/lobbySerializer";
import {
  findLobbyByMessage,
  getArguments,
  reactNegative,
  reactPositive,
} from "../misc/messageHelper";

/**
 * Kicks a player
 * @param {Message} message coaches message that triggered the kick
 * @param {Pool} dbHandle bot database handle
 */
export default async (message: Message, dbClient: DFZDataBaseClient) => {
  try {
    const kickSpecifics = await getKickSpecificsFromMessage(message, dbClient);
    await kickPlayerAndReact(kickSpecifics, message, dbClient);
  } catch (err) {
    console.log(`Error updating lobby after kicking: ${err}`);
  }
};

async function getKickSpecificsFromMessage(
  message: Message,
  dbClient: DFZDataBaseClient
): Promise<KickSpecifics> {
  return new Promise<KickSpecifics>(async (resolve, reject) => {
    try {
      const kickArguments = getKickArguments(message);
      const lobby = await findLobbyByMessage(
        dbClient,
        message.channel.id,
        kickArguments.messageId
      );
      const kickeeIndex = await getKickeeIndex(lobby, kickArguments.userId);
      resolve({ lobby: lobby, kickeeIndex: kickeeIndex });
    } catch (errorMessage) {
      reactNegative(message, errorMessage as string);
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

export function getKickeeIndex(lobby: Lobby, userId: string) {
  const kickeeIdx = lobby.users.findIndex((usr) => usr.id === userId);
  if (kickeeIdx === -1) throw "Did not find player to be kicked given the Id.";
  return kickeeIdx;
}

async function kickPlayerAndReact(
  kickSpecifics: KickSpecifics,
  message: Message,
  dbClient: DFZDataBaseClient
) {
  await kickPlayer(kickSpecifics, dbClient, message.channel);
  reactPositive(message, "Kicked player.");
}

export async function kickPlayer(
  kickSpecifics: KickSpecifics,
  dbClient: DFZDataBaseClient,
  channel: TextBasedChannels
) {
  kickSpecifics.lobby.users.splice(kickSpecifics.kickeeIndex, 1);

  const serializer = new LobbySerializer(dbClient);
  await serializer.update(kickSpecifics.lobby);

  await LobbyPostManipulator.tryUpdateLobbyPost(kickSpecifics.lobby, channel);
}

export async function kickMultiplePlayers(lobby: Lobby, userIDs: string[]) {
  userIDs.forEach((id) => {
    const idx = getKickeeIndex(lobby, id);
    lobby.users.splice(idx, 1);
  });
}
