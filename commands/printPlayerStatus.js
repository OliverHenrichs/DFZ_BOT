const c = require("../misc/constants")
const userHelper = require("../misc/userHelper")
const locker = require("../misc/lock")


/**
 * Function that reply's to a users call to !status. Provides player status in the message's channel 
 * @param {*} message message that triggered the player status reply function
 * @param {*} state current state of the bot
 */
module.exports = async (message, state) => {
	var channelLobbies = [];
	locker.acquireReadLock(function() {
		channelLobbies = state.lobbies[message.channel.id];
	}, () => {
		console.log("lock released in printPlayerStatus");
	});

	var users = [];
	var lobbyTypeNames = Object.keys(c.lobbyTypes);

	// get status from all channel lobbies
	lobbyTypeNames.forEach(lobbyType => {
		var lobby = channelLobbies[c.lobbyTypes[lobbyType]];
		if(lobby.users != undefined)
		{
			users.push(userHelper.getUser(lobby, message.author.username));
		}
	});

	var isSignedUp = false;
	var statusTexts = [];
	for (let i = 0; i < users.length; i++)
	{
		var user = users[i];
		if(user == undefined)
			continue;

		isSignedUp = true;
		var text = "Lobby type " + lobbyTypeNames[i];
		if(user.positions != undefined && user.positions.length != 0)
		{
			text += ", position" + (user.positions.length > 1 ? "s" : "") + " " + user.positions.join(", ");
		}
		statusTexts.push(text);
	}

	if(statusTexts.length == 0)
		message.reply("you are not signed up");
	else{
		message.reply("you are signed up for the following lobbies:\r\n" + statusTexts.join("\r\n"));
	}
	
}