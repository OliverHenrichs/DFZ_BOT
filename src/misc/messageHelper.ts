import { Message } from "discord.js";
import {
  getLobbyTypeByString,
  isSimpleLobbyType,
  lobbyManagementReactionEmojis,
  lobbyTypeKeysString,
  positionReactionEmojis,
  tryoutReactionEmoji,
} from "./constants";
import { getNumbersFromString } from "./generics";
import {
  getRegionalRoleFromString,
  getAllRegionStrings,
} from "./roleManagement";
import { createLobbyTime, LobbyTimeResult, Time } from "./timeZone";

/**
 * Reacts to message using reply and emoji, then deletes the authors command
 * @param {Discord.Message} message message to be replied to
 * @param {string} reply string containing reply message
 * @param {string} emoji emoji to react with
 */
async function reactToMessageAndDeleteIt(
  message: Message,
  reply: string,
  emoji: string
) {
  message.react(emoji).then(() => {
    if (message.channel.type !== "dm") message.delete({ timeout: 5000 });
  });

  if (reply == "") return;

  try {
    await message.author.send(`\`${message.content}\`` + `\n${emoji} ${reply}`);
  } catch (err) {
    message.reply(
      `Cannot send messages to ${message.author.username}. Enable direct messages in privacy settings to receive bot replies.`
    );
  }
}

/**
 * Creates a negative reaction
 * @param {Message} message message to react to
 * @param {string} reply string reply
 */
export function reactNegative(message: Message, reply = "") {
  reactToMessageAndDeleteIt(message, reply, "⛔");
}

/**
 * Creates a neutral reaction
 * @param {Message} message message to react to
 * @param {string} reply string reply
 */
export function reactNeutral(message: Message, reply = "") {
  reactToMessageAndDeleteIt(message, reply, "😐");
}

/**
 * Creates a positive reaction
 * @param {Message} message message to react to
 * @param {string} reply string reply
 */
export function reactPositive(message: Message, reply = "") {
  reactToMessageAndDeleteIt(message, reply, "✅");
}

/**
 * Creates initial reaction to lobby post for users to react to
 * @param {number} lobbyType
 * @param {Discord.Message} message
 */
export function createLobbyPostReactions(lobbyType: number, message: Message) {
  if (isSimpleLobbyType(lobbyType)) {
    message.react(tryoutReactionEmoji);
  } else {
    for (let idx = 0; idx < positionReactionEmojis.length; idx++) {
      message.react(positionReactionEmojis[idx]);
    }
  }

  for (let idx = 0; idx < lobbyManagementReactionEmojis.length; idx++) {
    message.react(lobbyManagementReactionEmojis[idx]);
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
  var args = getArguments(message);

  if (args.length <= index)
    throw `You need to provide a list of numbers ranging from ${min} to ${max}`;

  return getNumbersFromString(args[index]);
}

export function getLobbyRegionRoleFromMessage(
  message: Message,
  index: number
): string {
  var args = getArguments(message);

  if (args.length <= index)
    throw `Could not get lobby region role from message. Region roles are ${getAllRegionStrings()}`;

  return getRegionalRoleFromString(args[index]);
}

/**
 * Takes time part out of message by splitting and taking the part at index, then validates and returns the time
 * @param {Message} message message containing the time
 * @param {number} index position of time in the message
 */
export function getTimeFromMessage(
  message: Message,
  argumentIndex: number
): LobbyTimeResult {
  var args = getArguments(message);

  if (args.length <= argumentIndex + 1)
    throw "you need to provide a valid full hour time (e.g. 9pm CET, 6am GMT+2, ...) in your post";

  return createLobbyTime(args[argumentIndex], args[argumentIndex + 1]);
}

/**
 * Derives lobby type from message and reacts based on evaluation
 * @throws if it cannot evaluate lobby type
 * @param {Message} message message from which to derive lobby type
 */
export function getLobbyTypeFromMessage(message: Message): number {
  var args = getArguments(message);
  if (args.length === 0) {
    throw `No lobby type given. Lobby types are (${lobbyTypeKeysString})`;
  }
  return getLobbyTypeByString(args[0]);
}

/**
 * returns arguments of message of form "command arg1 arg2 ... argN"
 * @param {Message} message
 */
export function getArguments(message: Message): string[] {
  var content = message.content.split(" ");
  content.shift();
  return content;
}
