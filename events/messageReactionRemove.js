const lM = require("../misc/lobbyManagement")
const cM = require("../misc/channelManagement") 
const sM = require("../misc/scheduleManagement")

/**
 * remove reactions handling
 *
 * @param {*} client discord client
 * @param {*} reaction reaction to handle 
 * @param {*} user user who reacted
 */
module.exports = async (client, reaction, user) => {
    // only care for messages from self
	if (reaction.message.author.id !== process.env.BOT_ID)
		return;
    
    // ignore reactions from self
    if(user.id == process.env.BOT_ID)
        return;

    // ignore bot's DMs
    if(reaction.message.channel === undefined)
        return;

    if(reaction.message.channel.id === cM.scheduleChannelTryout || reaction.message.channel.id === cM.scheduleChannel5v5)
    {
        sM.removeCoachFromSchedule(client, reaction, user);
    } else {
        lM.updatePlayerInLobby(client, reaction, user);
    }
}