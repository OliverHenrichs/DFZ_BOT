const locker = require("../misc/lock")
const userHelper = require("../misc/userHelper")
const lM = require("../misc/lobbyManagement")
const mH = require("../misc/messageHelper")

/**
 * Handles a user's call to !withdraw. Withdraws the player if format is correct
 * @param {*} message user's message
 * @param {*} state bot state
 */
module.exports = async (message, state) => {

	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	var lobby = lM.getLobby(state, message.channel.id, type)
	if(lobby == undefined) {
		return mH.reactNegative(message, "There is no lobby created for channel <#" + message.channel.id + "> and type '" + type + "'");
	}

	// find user
	var idx = userHelper.getUserIndex(lobby, message.author.username);
	if (idx == -1) {
		return mH.reactNegative(message, "No joined player found under your username.\r\n You have not signed up yet.");
	} 

	// remove user
	locker.acquireWriteLock(function() {
		lobby.users.splice(idx,1);
	}, function() {
		console.log("lock released in withdrawPlayer");
		return mH.reactPositive(message, "You successfully withdrew your signup.");
	});

	userHelper.printLobbyUsers(state, message.channel.id, type);
}