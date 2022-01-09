import { Guild, Message, TextBasedChannels } from "discord.js";
import { DFZDataBaseClient } from "../logic/database/DFZDataBaseClient";
import { LobbyPostManipulator } from "../logic/lobby/LobbyPostManipulator";
import { Lobby } from "../logic/serializables/lobby";
import { LobbySerializer } from "../logic/serializers/LobbySerializer";
import { SerializeUtils } from "../logic/serializers/SerializeUtils";
import {
  findLobbyByMessage,
  getArguments,
  reactPositive,
} from "../misc/messageHelper";
import { IMessageIdentifier } from "../misc/types/IMessageIdentifier";

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
    reactPositive(message, "Failed kicking player:" + err);
  }
};

async function getKickSpecificsFromMessage(
  message: Message,
  dbClient: DFZDataBaseClient
): Promise<KickSpecifics> {
  if (!message.guildId) {
    throw new Error("Not a message from a guild.");
  }

  const kickArguments = getKickArguments(message);
  const mId: IMessageIdentifier = {
    messageId: kickArguments.messageId,
    channelId: message.channel.id,
    guildId: message.guildId,
  };
  const lobby = await findLobbyByMessage(dbClient, mId);
  const kickeeIndex = await getKickeeIndex(lobby, kickArguments.userId);
  return { lobby: lobby, kickeeIndex: kickeeIndex };
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
  if (kickeeIdx === -1)
    throw new Error("Did not find player to be kicked given the Id.");
  return kickeeIdx;
}

async function kickPlayerAndReact(
  kickSpecifics: KickSpecifics,
  message: Message,
  dbClient: DFZDataBaseClient
) {
  if (!message.guild) {
    throw new Error("Must be a guild message.");
  }
  await kickPlayer(kickSpecifics, dbClient, message.channel, message.guild);
  reactPositive(message, "Kicked player.");
}

export async function kickPlayer(
  kickSpecifics: KickSpecifics,
  dbClient: DFZDataBaseClient,
  channel: TextBasedChannels,
  guild: Guild
) {
  kickSpecifics.lobby.users.splice(kickSpecifics.kickeeIndex, 1);
  await updateLobbyInBackend(guild, dbClient, kickSpecifics.lobby);
  await LobbyPostManipulator.tryUpdateLobbyPost(kickSpecifics.lobby, channel);
}

async function updateLobbyInBackend(
  guild: Guild,
  dbClient: DFZDataBaseClient,
  lobby: Lobby
) {
  const gdbc = SerializeUtils.fromGuildtoGuildDBClient(guild, dbClient);
  const serializer = new LobbySerializer(gdbc);
  await serializer.update(lobby);
}

export async function kickMultiplePlayers(lobby: Lobby, userIDs: string[]) {
  userIDs.forEach((id) => {
    const idx = getKickeeIndex(lobby, id);
    lobby.users.splice(idx, 1);
  });
}
