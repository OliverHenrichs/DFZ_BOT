const locker = require("../misc/lock")
const mH = require("../misc/messageHelper")
const lM = require("../misc/lobbyManagement")


module.exports = async (message, state) => {
	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	var channel = message.channel.id;

	if(!lM.hasLobby(state, channel, type))
	{
		message.reply("There is no lobby created for channel <#" + message.channel.id + "> and type '" + type + "'");
		return;
	}

	locker.acquireWriteLock(function() {
		state.lobbies[channel][type].users= [];
	}, function() {
		console.log("lock released in clearPlayers");
	});
	
	await message.reply("Cleared all users from lobby");
}