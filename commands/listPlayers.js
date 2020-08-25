const c = require("../misc/constants")
const eC = require("../misc/answerEmbedding")
const lM = require("../misc/lobbyManagement");
const mH = require("../misc/messageHelper");

/**
 * Creates user table for unranked or botbash games
 * @param {*} state bot state
 * @param {*} channel channel in which the lobby resides
 */
function createMMRListUserTable(state, channel) {
	var lobby = lM.getLobby(state, channel, c.lobbyTypes.mmr);
	return lM.getCurrentUsersAsTable(lobby);
}

/**
 * Creates user table sorted by positions for inhouse lobbies
 * @param {*} state bot state
 * @param {*} channel channel in which the lobby resides
 */
function createPositionalUserTable(state, channel) {
	var lobby = lM.getLobby(state, channel, c.lobbyTypes.inhouse);

	var userTable = lM.getCurrentUsersAsTable(lobby);
	if(userTable == undefined) {
		return userTable;
	}

	for(let position = 1; position < 6; position++)
	{
		posUserTable = lM.getCurrentUsersWithPositionAsTable(lobby, position);
		if(posUserTable != undefined)
			userTable = userTable.concat(posUserTable);
	}
	return userTable;
}
/**
 * Handles coach's call to !list. Lists all players of all lobbies in the message's channel
 * @param {*} message message that caused the call to this handler
 * @param {*} state bot state
 */
module.exports = async (message, state) => {

	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	if(lM.getLobby(state, message.channel.id, type) == undefined)
	{
		return mH.reactNeutral(message, "No open "+c.getLobbyNameByType(type)+ " lobby yet.");
	}

	var userTable;

	// get user tables by lobby type
	if(type == c.lobbyTypes.mmr)
	{
		userTable = createMMRListUserTable(state, message.channel.id);
	} else if(type == c.lobbyTypes.inhouse)
	{
		userTable = createPositionalUserTable(state, message.channel.id);
	}

	mH.reactPositive(message);
	message.reply({embed: eC.generateEmbedding("List of users signed up for tonight's " + c.getLobbyNameByType(type) + " lobby", "", "", userTable)});
}