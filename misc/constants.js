
const lobbyTypes = {inhouse:1, mmr:2, botbash:3}
const lobbyTypePlayerCount = {inhouse:10, mmr:5, botbash:5}

module.exports = {
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
                return "5v5"
            case lobbyTypes.mmr:
                return "5 man unranked"
            case lobbyTypes.botbash:
                return "botbash"
        }
    } 
}