const userHelper = require("../misc/userHelper")
const lM = require("../misc/lobbyManagement")
const mH = require("../misc/messageHelper")

/**
 * Handles a user's call to !withdraw. Withdraws the player if format is correct
 * @param {*} message user's message
 * @param {*} state bot state
 */
module.exports = async (message, state) => {

	[lobby, type] = mH.getLobbyAndType(state, message)
	if(lobby == undefined || type == undefined)
		return;

	// find user
	var idx = userHelper.getUserIndex(lobby, message.author.id);
	if (idx == -1) {
		return mH.reactNegative(message, "No joined player found under your username.\r\n You have not signed up yet.");
	} 
	// remove user
	lobby.users.splice(idx,1);
	mH.reactPositive(message, "You successfully withdrew your signup.");
	
	// update lobby post
	lM.updateLobbyPost(lobby,message.channel);

	userHelper.printLobbyUsers(state, message.channel.id, type);
}