import { Message } from "discord.js";

const c = require("./constants");
const g = require("./generics");
const rM = require("./roleManagement");
const tZ = require("./timeZone");

/**
 * Reacts to message using reply and emoji
 * @param {Discord.Message} message message to be replied to
 * @param {string} reply string containing reply message
 * @param {string} emoji emoji to react with
 */
async function reactMessage(message: Message, reply: string, emoji: string) {
  message.react(emoji).then(() => {
    if (message.channel.type !== "dm") message.delete({ timeout: 5000 });
  });

  if (reply == "") return;

  try {
    await message.author.send(
      "`" + message.content + "`\n" + emoji + " " + reply
    );
  } catch (err) {
    message.reply(
      "Cannot send messages to you. Enable direct messages in privacy settings to receive bot replies."
    );
  }
}

/**
 * Creates a negative reaction
 * @param {Message} message message to react to
 * @param {string} reply string reply
 */
function reactNegative(message: Message, reply = "") {
  reactMessage(message, reply, "⛔");
}

/**
 * Creates a neutral reaction
 * @param {Message} message message to react to
 * @param {string} reply string reply
 */
function reactNeutral(message: Message, reply = "") {
  reactMessage(message, reply, "😐");
}

/**
 * Creates a positive reaction
 * @param {Message} message message to react to
 * @param {string} reply string reply
 */
function reactPositive(message: Message, reply = "") {
  reactMessage(message, reply, "✅");
}

/**
 * Creates initial reaction to lobby post for users to react to
 * @param {number} lobbyType
 * @param {Discord.Message} message
 */
function createLobbyPostReactions(lobbyType: number, message: Message) {
  if (c.isSimpleLobbyType(lobbyType)) {
    message.react(c.tryoutReactionEmoji);
  } else {
    for (let idx = 0; idx < c.positionReactionEmojis.length; idx++) {
      message.react(c.positionReactionEmojis[idx]);
    }
  }

  for (let idx = 0; idx < c.lobbyManagementReactionEmojis.length; idx++) {
    message.react(c.lobbyManagementReactionEmojis[idx]);
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
function getNumbersFromMessage(
  message: Message,
  index: number,
  min = 0,
  max = 5
) {
  var args = getArguments(message);

  if (args.length <= index)
    return [
      false,
      [],
      "you need to provide a list of numbers ranging from " +
        min +
        " to " +
        max +
        " in your post",
    ];

  return g.getNumbersFromString(args[index]);
}

/**
 * Retrieves a region from an index of a message split at spaces
 * message containing regional role
 * @param {Message} message
 * @param {number} index
 */
function getLobbyRegionRoleFromMessage(message: Message, index: number) {
  var args = getArguments(message);

  // message to short
  if (args.length <= index) return undefined;

  return rM.getRegionalRoleFromString(args[index]);
}

/**
 * Takes time part out of message by splitting and taking the part at index, then validates and returns the time
 * @param {Message} message message containing the time
 * @param {number} index position of time in the message
 */
function getTimeFromMessage(message: Message, index: number) {
  var args = getArguments(message);

  if (args.length <= index + 1)
    return [
      false,
      "",
      "you need to provide a valid full hour time (e.g. 9pm CET, 6am GMT+2, ...) in your post",
    ];

  return tZ.createLobbyTime(args[index], args[index + 1]);
}

/**
 * returns arguments of message of form "command arg1 arg2 ... argN"
 * @param {Message} message
 */
function getArguments(message: Message) {
  var content = message.content.split(" ");
  content.shift();
  return content;
}

/**
 * Derives lobby type from message and reacts based on evaluation
 * @param {Message} message message from which to derive lobby type
 */
function getLobbyType(message: Message) {
  var args = getArguments(message);

  if (args.length == 0) {
    reactNegative(
      message,
      "no lobby type given. \r\n Lobby types are (" +
        Object.keys(c.lobbyTypes).join(", ") +
        ")"
    );
    return undefined;
  }

  var type = args[0];
  var lobbyType = Object.keys(c.lobbyTypes).find((t) => {
    return t == type;
  });
  if (lobbyType == undefined) {
    reactNegative(
      message,
      "Invalid lobby type. Lobby types are " +
        Object.keys(c.lobbyTypes).join(", ")
    );
    return undefined;
  }

  return c.lobbyTypes[lobbyType];
}

module.exports.reactNeutral = reactNeutral;
module.exports.reactNegative = reactNegative;
module.exports.reactPositive = reactPositive;
module.exports.createLobbyPostReactions = createLobbyPostReactions;
module.exports.getNumbersFromMessage = getNumbersFromMessage;
module.exports.getLobbyRegionRoleFromMessage = getLobbyRegionRoleFromMessage;
module.exports.getArguments = getArguments;
module.exports.getLobbyType = getLobbyType;
module.exports.getTimeFromMessage = getTimeFromMessage;
