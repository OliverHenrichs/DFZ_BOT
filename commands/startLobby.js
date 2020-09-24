const c = require("../misc/constants")
const lM = require("../misc/lobbyManagement")
const mH = require("../misc/messageHelper")

const fiveMinInMS = 300000;
/**
 * Handles a coach's call to !start. Creates a lobby post
 * @param {*} message coach's message
 * @param {*} state bot state
 * @param {boolean} force Force game start even if not enough players are signed up. Tries to still matchmake where possible
 */
module.exports = async (message, state, force=false) => {
	
	// ignore command if lobby doesnt exist
	[lobby, type] = mH.getLobbyAndType(state, message)
	if(lobby == undefined || type == undefined)
		return;

	// prevent premature start of lobby
	var timeLeftInMS = lobby.date - new Date();
	if (timeLeftInMS > fiveMinInMS) { // 5min = 300.000 ms
		return mH.reactNegative(message, "It's not time to start the lobby yet. Once !start completes, people cannot join the lobby anymore!\nYou can use !start 5 minutes before the lobby start time.");
	}

	// check player count
	var key = Object.keys(c.lobbyTypes).find( typeKey => c.lobbyTypes[typeKey] == type);
	var playersPerLobby = c.lobbyTypePlayerCount[key];
	var lessThan = lobby.users.length < playersPerLobby;

	if(lessThan && !force)
		return mH.reactNegative(message, "There are fewer than " + playersPerLobby + " players signed up. Cannot start yet");

	// create new post with match-ups
	lM.createLobbyStartPost(state, message.channel, type, playersPerLobby);

	// delete the lobby and "archive" the lobby post
    lM.finishLobbyPost(lobby, message.channel);
	lM.removeLobby(state, message.channel.id, type);
	
	mH.reactPositive(message);
}