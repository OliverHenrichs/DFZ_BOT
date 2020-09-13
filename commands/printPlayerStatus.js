const c = require("../misc/constants")
const userHelper = require("../misc/userHelper")
const mH = require("../misc/messageHelper")


/**
 * Function that reply's to a users call to !status. Provides player status in the message's channel 
 * @param {*} message message that triggered the player status reply function
 * @param {*} state current state of the bot
 */
module.exports = async (message, state) => {
	var channelLobbies = state.lobbies[message.channel.id];
	if(channelLobbies === undefined)
		return mH.reactNeutral(message, "No lobbies in this channel");

	var users = [];
	var lobbyTypeNames = Object.keys(c.lobbyTypes);

	// get status from all channel lobbies
	lobbyTypeNames.forEach(lobbyType => {
		var lobby = channelLobbies[c.lobbyTypes[lobbyType]];
		if(lobby != undefined && lobby.users != undefined && lobby.users.length > 0)
		{
			users.push(userHelper.getUser(lobby, message.author.id));
		}
	});

	var statusTexts = [];
	for (let i = 0; i < users.length; i++)
	{
		var user = users[i];
		if(user == undefined)
			continue;

		var text = "Lobby type " + lobbyTypeNames[i];
		if(user.positions != undefined && user.positions.length != 0)
		{
			text += ", position" + (user.positions.length > 1 ? "s" : "") + " " + user.positions.join(", ");
		}
		statusTexts.push(text);
	}

	if(statusTexts.length == 0)
		return mH.reactNeutral(message, "You are not signed up");
	else{
		return mH.reactPositive(message, "you are signed up for the following lobbies:\r\n" + statusTexts.join("\r\n"));
	}
}