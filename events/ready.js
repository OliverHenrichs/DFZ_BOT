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
            var lobby = lM.getLobby(client._state, channel, c.lobbyTypes[key])
            if(lobby == undefined)
                continue;
            client.guilds.get(process.env.GUILD).channels.get(channel).fetchMessage(lobby.messageId).then(message => {
                console.log("TBD -> fetch reactions");
            }).catch(error => {
                console.log(error);
            });
          }
	});
}