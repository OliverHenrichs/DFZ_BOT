const lM = require("../misc/lobbyManagement")
const cM = require("../misc/channelManagement")
const c = require("../misc/constants")

/**
 * Fetch lobby messages from bot channels on startup
 *
 * @param {*} client discord client
 */
module.exports = async (client) => {
    console.log("Ready at " +  new Date().toLocaleString());
	cM.botChannels.forEach(channel => {
        for (var key in c.lobbyTypes){
            var lobbies = lM.getLobbiesOfType(client._state, channel, c.lobbyTypes[key])
            if(lobbies === undefined || lobbies.length === 0)
                continue;
                
            lobbies.forEach(lobby => {
                client.guilds.get(process.env.GUILD).channels.get(channel).fetchMessage(lobby.messageId).then(message => {
                    console.log("TBD -> fetch reactions");
                }).catch(error => {
                    console.log(error);
                });
            })
          }
    });

    if(client._state.schedules !== undefined)
    {
        var scheduleChannels = [cM.scheduleChannelTryout, cM.scheduleChannel5v5];
        scheduleChannels.forEach(channel => {

            var lastMessage = "";
    
            for(let i = 0; i < client._state.schedules.length; i++)
            {
                var s = client._state.schedules[i];
                if (lastMessage === s.message)
                    continue;
    
                // TODO add channel to schedule to avoid failed fetching here
                lastMessage = s.message;
                client.guilds.get(process.env.GUILD).channels.get(channel).fetchMessage(s.message).then(message => {
                    
                }).catch(error => {
                    // dont matter, we check all channels
                });
            }
        });
    }
}