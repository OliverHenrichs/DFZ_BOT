const locker = require("../misc/lock")
const userHelper = require("../misc/userHelper")
const lM = require("../misc/lobbyManagement")

module.exports = async (message, state) => {

	// check existing lobby
	if(!lM.hasLobby(state)) {
		return message.reply("No lobby scheduled for today, yet.");
	}

	var idx = userHelper.getUserIndex(state, message.author.username);
	if (idx == -1) {
		await message.reply("No joined player found under your username; You have not even signed up :P");
		return;
	} 

	// remove user
	locker.acquireWriteLock(function() {
		state.lobby.users.splice(idx,1);
	}, function() {
		console.log("lock released");
	});
	await message.reply("You successfully withdrew your signup.");

	userHelper.printUsers(state);
}