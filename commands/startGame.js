const c = require("../misc/constants")
const lM = require("../misc/lobbyManagement")
const mH = require("../misc/messageHelper")
const locker = require("../misc/lock")

/**
 * Handles a coach's call to !start. Creates a lobby post
 * @param {*} message coach's message
 * @param {*} state bot state
 * @param {*} force Force game start even if not enough players are signed up. Tries to still matchmake where possible
 */
module.exports = async (message, state, force=false) => {

	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	var channel = message.channel.id;
	if(lM.getLobby(state, channel, type) == undefined) {
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