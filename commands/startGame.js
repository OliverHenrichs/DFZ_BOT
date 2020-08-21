const c = require("../misc/constants")
const lM = require("../misc/lobbyManagement")
const mH = require("../misc/messageHelper")
const locker = require("../misc/lock")

module.exports = async (message, state, force=false) => {

	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	var channel = message.channel.id;

	if(!lM.hasLobby(state, channel, type)) {
		return message.reply("no lobby has been created yet");
	}
	
	var key = Object.keys(c.lobbyTypes).find( typeKey => c.lobbyTypes[typeKey] == type);
	var playersPerLobby = c.lobbyTypePlayerCount[key];

	var lessThan = false;
    locker.acquireReadLock(function() {
		lessThan = state.lobbies[channel][type].users.length < playersPerLobby;
	}, () => {
		console.log("lock released in startGame");
	});


    if(lessThan && !force)
         return message.reply("There are fewer than " + playersPerLobby + " players signed up. Cannot start yet");

	// create lobby
	lM.createLobbyPost(state, message.channel, type, playersPerLobby);
}