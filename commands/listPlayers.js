const c = require("../misc/constants")
const eC = require("../misc/answerEmbedding")
const lM = require("../misc/lobbyManagement");
const mH = require("../misc/messageHelper");


function createMMRListUserTable(state, channel) {
	return lM.getCurrentUsersAsTable(state.lobbies[channel][c.lobbyTypes.mmr]);
}

function createPositionalUserTable(state, channel) {
	var userTable = lM.getCurrentUsersAsTable(state.lobbies[channel][c.lobbyTypes.inhouse]);
	if(userTable == undefined) {
		return userTable;
	}

	for(let position = 1; position < 6; position++)
	{
		posUserTable = lM.getCurrentUsersWithPositionAsTable(state.lobbies[channel][c.lobbyTypes.inhouse], position);
		if(posUserTable != undefined)
			userTable = userTable.concat(posUserTable);
	}
	return userTable;
}

module.exports = (message, state) => {
	
	var args = mH.getArguments(message);
	if(args.length == 0 || Object.keys(c.lobbyTypes).find((key) => key == args[0]) == undefined)
	{
		message.reply("Proper format is !list <lobbyType> with <lobbyType> = '" + Object.keys(c.lobbyTypes).join("' or '") + "'.");
		return;
	}

	var lobbyType = args[0];

	if(!lM.hasLobby(state, message.channel.id, c.lobbyTypes[lobbyType]))
	{
		message.reply("no open lobby of type " + lobbyType + " yet.");
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

	const _embed = eC.generateEmbedding("List of users signed up for tonight's " + lobbyType + " lobby", "", "", 'success', userTable);
	message.reply({embed: _embed});
}