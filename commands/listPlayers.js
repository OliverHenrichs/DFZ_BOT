const eC = require("../misc/answerEmbedding")
const lM = require("../misc/lobbyManagement")

module.exports = (message, state, client) => {
	if(!lM.hasLobby(state))
	{
		message.reply("No open lobby yet.");
		return;
	}

	var userTable = lM.getCurrentUsersAsTable(state);
	if(userTable == undefined) {
		message.reply("No signups so far.");
		return;
	}
	
	const _embed = eC.generateEmbedding("List of users signed up for tonight's lobby", "", "", 'success', userTable);
	const channel = client.channels.get(process.env.LOBBY_SIGNUP_CHANNEL_ID);
	channel.send({embed: _embed});

}