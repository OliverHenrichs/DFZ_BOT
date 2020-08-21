const lM = require("../misc/lobbyManagement")
const locker = require("../misc/lock")

module.exports = async (message, state, client, force=false) => {

	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	var channel = message.channel.id;

	if(!lM.hasLobby(state, channel, type)) {
		return message.reply("no lobby has been created yet");
	}
	
	var lessThan = false;
    locker.acquireReadLock(function() {
		lessThan = state.lobbies[channel][type].users.length < 10;
	}, () => {
		console.log("lock released in startGame");
	});


    if(lessThan && !force)
         return message.reply("There are less than 10 players signed up. Cannot start yet");

	// create lobby
	lM.createLobbyPost(state, client, message.channel.id, type);
}