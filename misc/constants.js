
const lobbyTypes = {inhouse:1, unranked:2, botbash:3, tryout: 4}
const lobbyTypePlayerCount = {inhouse:10, unranked:5, botbash:5, tryout: 5}
const positionReactionEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
const tryoutReactionEmoji = '✅';
const lobbyManagementReactionEmojis =['🔒', '❌'];

module.exports = {
    tryoutReactionEmoji: tryoutReactionEmoji,
    positionReactionEmojis: positionReactionEmojis,
    lobbyManagementReactionEmojis: lobbyManagementReactionEmojis,
    lobbyTypes: lobbyTypes,
    lobbyTypePlayerCount: lobbyTypePlayerCount,

    /**
     * Returns lobby name for usage in communication strings
     * @param {*} lobbyType given lobby type
     * @return communication string according to lobby type
     */
    getLobbyNameByType: function(lobbyType) {
        switch (lobbyType)
        {
            case lobbyTypes.inhouse:
                return "Inhouse"
            case lobbyTypes.unranked:
                return "Unranked"
            case lobbyTypes.botbash:
                return "Botbash"
            case lobbyTypes.tryout:
                return "Tryout"
        }
    },

    /**
     * checks reaction emoji for ingame position
     * @param {Emoji} reactionEmoji given emoji
     */
    getReactionEmojiPosition: function(reactionEmoji) {
        var idx = positionReactionEmojis.findIndex(type =>  {
            return reactionEmoji.name === type;
        });
        
        return idx+1; // +1 to match pos 1-5 instead of 0-4...
    },

    isKnownPositionEmoji: function(reactionEmoji) {
        return positionReactionEmojis.includes(reactionEmoji.name);
    },

    isKnownTryoutEmoji: function(reactionEmoji) {
        return tryoutReactionEmoji === reactionEmoji.name;
    },

    isKnownLobbyManagementEmoji: function(reactionEmoji) {
        return lobbyManagementReactionEmojis.includes(reactionEmoji.name);
    }
}