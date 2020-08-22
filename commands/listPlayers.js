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
	
	var args = mH.getArguments(message);
	if(args.length == 0 || Object.keys(c.lobbyTypes).find((key) => key == args[0]) == undefined)
	{
		message.reply("Proper format is !list <lobbyType> with <lobbyType> = '" + Object.keys(c.lobbyTypes).join("' or '") + "'.");
		return;
	}

	var lobbyType = args[0];

	if(lM.getLobby(state, message.channel.id, c.lobbyTypes[lobbyType]) == undefined)
	{
		message.reply("no open "+c.getLobbyNameByType(lobbyType)+ " lobby yet.");
		return;
	}

	var userTable = [];

	// get user tables by lobby type
	if(c.lobbyTypes[lobbyType] == c.lobbyTypes.mmr)
	{
		userTable = createMMRListUserTable(state, message.channel.id);

	} else if(c.lobbyTypes[lobbyType] == c.lobbyTypes.inhouse)
	{
		userTable = createPositionalUserTable(state, message.channel.id);
	}

	if(userTable == undefined) {
		message.reply("Opened " + lobbyType + " lobby open, but no signups so far.");
		return;
	}

	const _embed = eC.generateEmbedding("List of users signed up for tonight's " + c.getLobbyNameByType(lobbyType) + " lobby", "", "", 'success', userTable);
	message.reply({embed: _embed});
}