import { GuildEmoji, ReactionEmoji } from "discord.js";

export const lobbyTypes = {
  inhouse: 1,
  unranked: 2,
  botbash: 3,
  tryout: 4,
  replayAnalysis: 5,
  meeting: 6,
};

export const lobbyTypePlayerCount = {
  inhouse: 10,
  unranked: 5,
  botbash: 5,
  tryout: 5,
  replayAnalysis: 1000,
  meeting: 1000,
};
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
};

/**
 * Returns true if lobbytype is found in roleBasedLobbyTypes
 * @param {number} lobbyType
 */
 export function isRoleBasedLobbyType(lobbyType: number) {
  return (
    roleBasedLobbyTypes.find(
      (s_type: number) => s_type === lobbyType
    ) !== undefined
  );
};

/**
 * Returns lobby name for usage in communication strings
 * @param {number} lobbyType given lobby type
 * @return communication string according to lobby type
 */
 export function getLobbyNameByType(lobbyType: number) {
  switch (lobbyType) {
    case lobbyTypes.inhouse:
      return "Inhouse";
    case lobbyTypes.unranked:
      return "Unranked";
    case lobbyTypes.botbash:
      return "Botbash";
    case lobbyTypes.tryout:
      return "Tryout";
    case lobbyTypes.replayAnalysis:
      return "Replay analysis";
    default:
      return "Unknown"
  }
};

export function getLobbyPostNameByType(lobbyType: number) {
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
};

/**
 * checks reaction emoji for ingame position
 * @param {string} reactionEmoji given emoji
 */
 export function getReactionEmojiPosition(reactionEmoji:  GuildEmoji | ReactionEmoji) {
  var idx = positionReactionEmojis.findIndex((type) => {
    return reactionEmoji.name === type;
  });

  return idx + 1; // +1 to match pos 1-5 instead of 0-4...
};

export function isKnownPositionEmoji(reactionEmoji: GuildEmoji | ReactionEmoji) {
  return positionReactionEmojis.includes(reactionEmoji.name);
};

export function isKnownSimpleLobbyEmoji(reactionEmoji: GuildEmoji | ReactionEmoji) {
  return tryoutReactionEmoji === reactionEmoji.name;
};

export function isKnownLobbyManagementEmoji(reactionEmoji: GuildEmoji | ReactionEmoji) {
  return lobbyManagementReactionEmojis.includes(reactionEmoji.name);
};
