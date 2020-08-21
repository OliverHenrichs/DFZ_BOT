
const lobbyTypes = {inhouse:1, mmr:2, botbash:3}
const lobbyTypePlayerCount = {inhouse:10, mmr:5, botbash:5}

module.exports = {
    lobbyTypes: lobbyTypes,
    lobbyTypePlayerCount: lobbyTypePlayerCount,
    getLobbyNameByType: function(lobbyType) {
        switch (lobbyType)
        {
            case lobbyTypes.inhouse:
                return "5v5"
            case lobbyTypes.mmr:
                return "Unranked"
            case lobbyTypes.inhouse:
                return "Botbash"
        }
    } 
}