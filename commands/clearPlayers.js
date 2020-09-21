const mH = require("../misc/messageHelper")
const lM = require("../misc/lobbyManagement")

/**
 * Handles a coach's call to !clear. Clears all players from given lobby
 * @param {*} message message that triggered this call
 * @param {*} state bot state
 */
module.exports = async (message, state) => {
	
	[lobby, type] = mH.getLobbyAndType(state, message)
	if(lobby == undefined || type == undefined)
		return;

	// clear users
	lobby.users = [];
	lM.updateLobbyPost(lobby,message.channel);

	return mH.reactPositive(message, "cleared all users from lobby");
}