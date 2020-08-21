const userHelper = require("../misc/userHelper")
const locker = require("../misc/lock")
const lM = require("../misc/lobbyManagement")

module.exports = (message, state) => {
	locker.acquireReadLock(function() {
		var channelLobbies = state.lobbies[message.channel.id];
		var users = [];

		var lobbyTypeNames = Object.keys(lM.lobbyTypes);
		// get status from all channel lobbies
		lobbyTypeNames.forEach(lobbyType => {
			var lobby = channelLobbies[lM.lobbyTypes[lobbyType]];
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
			message.reply("you are signed for the following lobbies:\r\n" + statusTexts.join("\r\n"));
		}
	}, () => {
		console.log("lock released in printPlayerStatus");
	});
}