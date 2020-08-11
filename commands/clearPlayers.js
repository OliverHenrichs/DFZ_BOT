const locker = require("../misc/lock")
module.exports = async (message, state) => {

	locker.acquireWriteLock(function() {
		state.length = 0;
		state.lobby.users = [];
	}, function() {
		console.log("lock released in clearPlayers");
	});
	
	await message.reply("Cleared all users");
}