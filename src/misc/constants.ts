import { GuildEmoji, ReactionEmoji } from "discord.js";
import * as dotenv from "dotenv";

dotenv.config();

export const botToken: string = process.env.BOT_TOKEN
  ? process.env.BOT_TOKEN
  : "";

export const botId: string = process.env.BOT_ID ? process.env.BOT_ID : "";

export const dfzGuildId: string =
  process.env.GUILD !== undefined ? process.env.GUILD : "";

export const lobbyTypes = {
  inhouse: 1,
  unranked: 2,
  botbash: 3,
  tryout: 4,
  replayAnalysis: 5,
  meeting: 6,
};

export const lobbyTypeKeys = Object.keys(lobbyTypes);
export const lobbyTypeKeysString = lobbyTypeKeys.join(", ");

export function getLobbyTypeByString(type: string) {
  const idx = lobbyTypeKeys.findIndex((key) => type === key);
  if (idx === -1)
    throw `Invalid lobby type ${type}. Lobby types are ${lobbyTypeKeysString}`;
  return idx + 1;
}

export const lobbyTypePlayerCount = {
  inhouse: 10,
  unranked: 5,
  botbash: 5,
  tryout: 5,
  replayAnalysis: 1000,
  meeting: 1000,
};
export const anyNumberOfPlayers = -1;

export function getPlayersPerLobbyByLobbyType(type: number) {
  const lobbyTypeKey = (
    Object.keys(lobbyTypes) as Array<keyof typeof lobbyTypes>
  ).find((typeKey) => lobbyTypes[typeKey] === type);
  if (lobbyTypeKey) return lobbyTypePlayerCount[lobbyTypeKey];

  return anyNumberOfPlayers;
}

export const positionReactionEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
export const tryoutReactionEmoji = "✅";
export const lobbyManagementReactionEmojis = ["🔒", "❌", "🧑‍🏫"];

export const simpleLobbyTypes = [
  lobbyTypes.tryout,
  lobbyTypes.replayAnalysis,
  lobbyTypes.meeting,
];

export const roleBasedLobbyTypes = [
  lobbyTypes.inhouse,
  lobbyTypes.unranked,
  lobbyTypes.botbash,
];

/**
 * Returns true if lobbytype is found in simpleLobbyTypes
 * @param {number} lobbyType
 */
export function isSimpleLobbyType(lobbyType: number) {
  return (
    simpleLobbyTypes.find((s_type: number) => s_type === lobbyType) !==
    undefined
  );
}

/**
 * Returns true if lobbytype is found in roleBasedLobbyTypes
 * @param {number} lobbyType
 */
export function isRoleBasedLobbyType(lobbyType: number) {
  return (
    roleBasedLobbyTypes.find((s_type: number) => s_type === lobbyType) !==
    undefined
  );
}

/**
 * Returns lobby name for usage in communication strings
 * @param {number} lobbyType given lobby type
 * @return communication string according to lobby type
 */
export function getLobbyNameByType(lobbyType: number) {
  switch (lobbyType) {
    case lobbyTypes.inhouse:
      return "inhouse";
    case lobbyTypes.unranked:
      return "unranked";
    case lobbyTypes.botbash:
      return "botbash";
    case lobbyTypes.tryout:
      return "tryout";
    case lobbyTypes.replayAnalysis:
      return "replay analysis";
    case lobbyTypes.meeting:
      return "meeting";
    default:
      return "Unknown";
  }
}

export function getLobbyPostNameByType(lobbyType: number): string | undefined {
  switch (lobbyType) {
    case lobbyTypes.inhouse:
      return "an INHOUSE lobby";
    case lobbyTypes.unranked:
      return "an UNRANKED lobby";
    case lobbyTypes.botbash:
      return "a BOTBASH lobby";
    case lobbyTypes.tryout:
      return "a TRYOUT lobby";
    case lobbyTypes.replayAnalysis:
      return "a REPLAY ANALYSIS session";
    case lobbyTypes.meeting:
      return "a meeting";
  }
}

/**
 * checks reaction emoji for ingame position
 * @param {string} reactionEmoji given emoji
 */
export function getReactionEmojiPosition(
  reactionEmoji: GuildEmoji | ReactionEmoji
) {
  const idx = positionReactionEmojis.findIndex((type) => {
    return reactionEmoji.name === type;
  });

  return idx + 1; // +1 to match pos 1-5 instead of 0-4...
}

export function isKnownPositionEmoji(
  reactionEmoji: GuildEmoji | ReactionEmoji
) {
  return (
    reactionEmoji.name && positionReactionEmojis.includes(reactionEmoji.name)
  );
}

export function isKnownSimpleLobbyEmoji(
  reactionEmoji: GuildEmoji | ReactionEmoji
) {
  return tryoutReactionEmoji === reactionEmoji.name;
}

export function isKnownLobbyManagementEmoji(
  reactionEmoji: GuildEmoji | ReactionEmoji
) {
  return (
    reactionEmoji.name &&
    lobbyManagementReactionEmojis.includes(reactionEmoji.name)
  );
}

/**
 * Returns required number of coaches for a given lobby type
 * @param {number} lobbyType given lobby type
 * @return {number}
 */
export function getCoachCountByLobbyType(lobbyType: number) {
  switch (lobbyType) {
    case lobbyTypes.inhouse:
      return 2;
    case lobbyTypes.unranked:
      return 1;
    case lobbyTypes.botbash:
      return 1;
    case lobbyTypes.tryout:
      return 1;
    case lobbyTypes.replayAnalysis:
      return 1;
    case lobbyTypes.meeting:
      return 1;
  }
  return 0;
}
