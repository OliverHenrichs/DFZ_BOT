const c = require("../misc/constants")
const aE = require("../misc/answerEmbedding")
const lM = require("../misc/lobbyManagement");
const mH = require("../misc/messageHelper");

/**
 * Creates user table sorted by positions for inhouse lobbies
 * @param {*} lobby lobby to create users from
 */
function createPositionalUserTable(lobby) {

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

	[lobby, type] = mH.getLobbyAndType(state, message)
	if(lobby == undefined || type == undefined)
		return;
		
	// get user tables by lobby type
	var userTable;
	if(type == c.lobbyTypes.unranked || type == c.lobbyTypes.botbash|| type == c.lobbyTypes.tryout)
		userTable = lM.getCurrentUsersAsTable(lobby);
	else if(type == c.lobbyTypes.inhouse)
		userTable = createPositionalUserTable(lobby);

	mH.reactPositive(message);
	message.author.send({embed: aE.generateEmbedding("List of users signed up for tonight's " + c.getLobbyNameByType(type) + " lobby", "", "", userTable)});
}