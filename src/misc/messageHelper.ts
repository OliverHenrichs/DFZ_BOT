import {Guild, Message} from "discord.js";
import {DFZDataBaseClient} from "../logic/database/DFZDataBaseClient";
import {getAllRegionNames, getRegionalRoleFromRegionName,} from "../logic/discord/RoleManagement";
import {Lobby} from "../logic/serializables/Lobby";
import {LobbySerializer} from "../logic/serializers/LobbySerializer";
import {SerializeUtils} from "../logic/serializers/SerializeUtils";
import {ILobbyTimeResult} from "../logic/time/interfaces/ILobbyTimeResult";
import {getLobbyTimeFromMessageString} from "../logic/time/TimeZone";
import {
  getLobbyTypeByString,
  isSimpleLobbyType,
  lobbyManagementReactionEmojis,
  lobbyTypeKeysString,
  positionReactionEmojis,
  tryoutReactionEmoji,
} from "./constants";
import {getNumbersFromString} from "./generics";
import {IMessageIdentifier} from "./types/IMessageIdentifier";
import {TimeInMs} from "../logic/time/TimeConverter";
import {IReactionData} from "./types/IReactionData";

/**
 * Reacts to message using reply and emoji, then deletes the authors command.
 * @param data
 * @param emoji Emoji to react with.
 */
async function reactToMessageAndDeleteIt(data: IReactionData, emoji: string) {
  await data.message.react(emoji);

  if (data.deleteMessage && data.message.channel.type !== "DM")
    setTimeout(() => data.message.delete(), 5 * TimeInMs.oneSecond);

  if (data.reply == "") return;

  try {
    await data.message.author.send(
      `\`${data.message.content}\`` + `\n${emoji} ${data.reply}`
    );
  } catch (err) {
    await data.message.reply(
      `Cannot send messages to ${data.message.author.username}. Enable direct messages in privacy settings to receive bot replies.`
    );
  }
}

/**
 * Creates a negative reaction and deletes the message that has been reacted to
 */
export async function reactNegative(data: IReactionData) {
  await reactToMessageAndDeleteIt(data, "⛔");
}

/**
 * Creates a positive reaction and deletes the message that has been reacted to
 */
export async function reactPositive(data: IReactionData) {
  await reactToMessageAndDeleteIt(data, "✅");
}

/**
 * Creates initial reaction to lobby post for users to react to.
 * @param lobbyType
 * @param message
 */
export async function createLobbyPostReactions(
  lobbyType: number,
  message: Message
) {
  if (isSimpleLobbyType(lobbyType)) {
    await message.react(tryoutReactionEmoji);
  } else {
    for (let idx = 0; idx < positionReactionEmojis.length; idx++) {
      await message.react(positionReactionEmojis[idx]);
    }
  }

  for (let idx = 0; idx < lobbyManagementReactionEmojis.length; idx++) {
    await message.react(lobbyManagementReactionEmojis[idx]);
  }
}

/**
 * Retrieves a sequence of unique numbers from an index of a message split at spaces
 * @param {Message} message message containing numbers
 * @param {number} index index at which the message content must be split in order to retrieve numbers
 * @param {number} min min allowed number
 * @param {number} max max allowed number
 * @return [true if success, unique numbers, error message if not success]
 */
export function getNumbersFromMessage(
  message: Message,
  index: number,
  min = 0,
  max = 5
) {
  const args = getArguments(message);

  if (args.length <= index)
    throw `You need to provide a list of numbers ranging from ${min} to ${max}`;

  return getNumbersFromString(args[index]);
}

export function getLobbyRegionRoleFromMessage(
  message: Message,
  index: number
): string {
  const args = getArguments(message);

  if (args.length <= index)
    throw `Could not get lobby region role from message. Region roles are ${getAllRegionNames()}`;

  return getRegionalRoleFromRegionName(args[index]);
}

/**
 * Takes time part out of message by splitting and taking the part at index, then validates and returns the time
 * @param message message containing the time
 * @param argumentIndex
 */
export function getTimeFromMessage(
  message: Message,
  argumentIndex: number
): ILobbyTimeResult {
  const args = getArguments(message);

  if (args.length <= argumentIndex + 1)
    throw new Error(
      "you need to provide a valid full hour time (e.g. 9pm CET, 6am GMT+2, ...) in your post"
    );

  return getLobbyTimeFromMessageString(
    args[argumentIndex],
    args[argumentIndex + 1]
  );
}

/**
 * Derives lobby type from message and reacts based on evaluation
 * @throws if it cannot evaluate lobby type
 * @param {Message} message message from which to derive lobby type
 */
export function getLobbyTypeFromMessage(message: Message): number {
  const args = getArguments(message);
  if (args.length === 0) {
    throw `No lobby type given. Lobby types are (${lobbyTypeKeysString})`;
  }
  return getLobbyTypeByString(args[0]);
}

/**
 *  Finds lobby by its channel and message
 *  @return undefined if not found, else returns the lobby
 *  @param dbClient
 *  @param mId
 */
export async function findLobbyByMessage(
  dbClient: DFZDataBaseClient,
  mId: IMessageIdentifier
): Promise<Lobby> {
  const gdbc = SerializeUtils.getGuildDBClient(mId.guildId, dbClient);
  const serializer = new LobbySerializer(gdbc, mId.channelId, mId.messageId);
  const lobbies = await serializer.get();
  if (lobbies.length !== 1)
    throw new Error(
      `Could not find lobby by channelId=${mId.channelId}, messageId=${mId.messageId}`
    );

  return lobbies[0];
}

/**
 * returns arguments of message of form "command arg1 arg2 ... argN"
 * @param {Message} message
 */
export function getArguments(message: Message): string[] {
  const content = message.content.split(" ");
  content.shift();
  return content;
}

export function getGuildFromMessage(message: Message): Guild {
  if (!message.guild) throw new Error("Only guild messages");
  return message.guild;
}

export function getGuildIdFromMessage(message: Message): string {
  if (!message.guild) throw new Error("Only guild messages");
  return message.guild.id;
}
