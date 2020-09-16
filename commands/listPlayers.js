const c = require("../misc/constants")
const aE = require("../misc/answerEmbedding")
const lM = require("../misc/lobbyManagement");
const mH = require("../misc/messageHelper");

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
		return mH.reactNegative(message, "Provide a  lobby type. Valid lobby types are " + Object.keys(c.lobbyTypes).join("', '") + ".");

	if(lM.getLobby(state, message.channel.id, type) == undefined)
		return mH.reactNeutral(message, "No open "+c.getLobbyNameByType(type)+ " lobby yet.");

	// get user tables by lobby type
	var userTable;
	if(type == c.lobbyTypes.unranked || type == c.lobbyTypes.botbash)
		userTable = lM.getCurrentUsersAsTable(lobby);
	else if(type == c.lobbyTypes.inhouse)
		userTable = createPositionalUserTable(state, message.channel.id);

	mH.reactPositive(message);
	message.author.send({embed: aE.generateEmbedding("List of users signed up for tonight's " + c.getLobbyNameByType(type) + " lobby", "", "", userTable)});
	//test
}