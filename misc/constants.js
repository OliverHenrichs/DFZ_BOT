
const lobbyTypes = {inhouse:1, unranked:2, botbash:3}
const lobbyTypePlayerCount = {inhouse:10, unranked:5, botbash:5}

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
            case lobbyTypes.unranked:
                return "5 man unranked"
            case lobbyTypes.botbash:
                return "botbash"
        }
    } 
}