const locker = require("../misc/lock")
const userHelper = require("../misc/userHelper")
const lM = require("../misc/lobbyManagement")
const mH = require("../misc/messageHelper")

module.exports = async (message, state) => {

	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	if(!lM.hasLobby(state, message.channel.id, type)) {
		return message.reply("no lobby scheduled for today yet.");
	}
	var lobby = state.lobbies[message.channel.id][type];

	// find user
	var idx = userHelper.getUserIndex(lobby, message.author.username);
	if (idx == -1) {
		return message.reply("no joined player found under your username.\r\n You have not signed up yet.");
	} 

	// remove user
	locker.acquireWriteLock(function() {
		lobby.users.splice(idx,1);
	}, function() {
		console.log("lock released in withdrawPlayer");
	});
	await message.reply("you successfully withdrew your signup.");

	userHelper.printUsers(state.lobbies[message.channel.id][type]);
}