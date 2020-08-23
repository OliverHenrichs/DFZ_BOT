const locker = require("../misc/lock")
const mH = require("../misc/messageHelper")
const lM = require("../misc/lobbyManagement")

/**
 * Handles a coach's call to !clear. Clears all players from given lobby
 * @param {*} message message that triggered this call
 * @param {*} state bot state
 */
module.exports = async (message, state) => {
	// message must provide lobby type
	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	// get lobby
	var channelId = message.channel.id
	var lobby = lM.getLobby(state, channelId, type)
	if(lobby == undefined) {
		return mH.reactNegative(message, "There is no lobby created for channel <#" + channelId + "> and type '" + type + "'");
	}

	// clear users
	locker.acquireWriteLock(function() {
		state.lobbies[channelId][type].users= [];
	}, function() {
		console.log("lock released in clearPlayers");
		return mH.reactPositive(message, "cleared all users from lobby");
	});
}