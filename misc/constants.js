const lobbyTypes = {
  inhouse: 1,
  unranked: 2,
  botbash: 3,
  tryout: 4,
  replayAnalysis: 5,
  meeting: 6,
};
const lobbyTypePlayerCount = {
  inhouse: 10,
  unranked: 5,
  botbash: 5,
  tryout: 5,
  replayAnalysis: 1000,
  meeting: 1000,
};
const positionReactionEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
const tryoutReactionEmoji = "✅";
const lobbyManagementReactionEmojis = ["🔒", "❌", "🧑‍🏫"];

module.exports = {
  tryoutReactionEmoji: tryoutReactionEmoji,
  positionReactionEmojis: positionReactionEmojis,
  lobbyManagementReactionEmojis: lobbyManagementReactionEmojis,
  lobbyTypes: lobbyTypes,
  simpleLobbyTypes: [
    lobbyTypes.tryout,
    lobbyTypes.replayAnalysis,
    lobbyTypes.meeting,
  ],
  roleBasedLobbyTypes: [
    lobbyTypes.inhouse,
    lobbyTypes.unranked,
    lobbyTypes.botbash,
  ],
  lobbyTypePlayerCount: lobbyTypePlayerCount,

  /**
   * Returns true if lobbytype is found in simpleLobbyTypes
   * @param {number} lobbyType
   */
  isSimpleLobbyType: function (lobbyType) {
    return (
      this.simpleLobbyTypes.find((s_type) => s_type === lobbyType) !== undefined
    );
  },

  /**
   * Returns true if lobbytype is found in roleBasedLobbyTypes
   * @param {number} lobbyType
   */
  isRoleBasedLobbyType: function (lobbyType) {
    return (
      this.roleBasedLobbyTypes.find((s_type) => s_type === lobbyType) !==
      undefined
    );
  },

  /**
   * Returns lobby name for usage in communication strings
   * @param {number} lobbyType given lobby type
   * @return communication string according to lobby type
   */
  getLobbyNameByType: function (lobbyType) {
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
    }
  },

  getLobbyPostNameByType: function (lobbyType) {
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
  },

  /**
   * checks reaction emoji for ingame position
   * @param {string} reactionEmoji given emoji
   */
  getReactionEmojiPosition: function (reactionEmoji) {
    var idx = positionReactionEmojis.findIndex((type) => {
      return reactionEmoji.name === type;
    });

    return idx + 1; // +1 to match pos 1-5 instead of 0-4...
  },

  isKnownPositionEmoji: function (reactionEmoji) {
    return positionReactionEmojis.includes(reactionEmoji.name);
  },

  isKnownSimpleLobbyEmoji: function (reactionEmoji) {
    return tryoutReactionEmoji === reactionEmoji.name;
  },

  isKnownLobbyManagementEmoji: function (reactionEmoji) {
    return lobbyManagementReactionEmojis.includes(reactionEmoji.name);
  },
};
