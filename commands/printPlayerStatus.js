const userHelper = require("../misc/userHelper")
const locker = require("../misc/lock")

module.exports = (message, state) => {
	var user = userHelper.getUser(state, message.author.username);
	locker.acquireReadLock(function() {
		if(user == undefined || user.positions == undefined)
			message.reply("You are not signed up");
		else
			message.reply("You are signed up for positions " + user.positions.join(", "));
	});
}