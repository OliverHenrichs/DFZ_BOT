const locker = require("../misc/lock")
const playerPositions = require("../misc/messageHelper")
const userHelper = require("../misc/userHelper")
const lM = require("../misc/lobbyManagement")

var formatString = "\n Proper format is e.g. '!correct 1,3,4' or '!correct 1' or '!correct 5,2' or any other combination (allowed numbers 1,2,3,4,5)";

module.exports = async (message, state) => {
	
	// check existing lobby
	if(!lM.hasLobby(state)) {
		return message.reply("No lobby scheduled for today, yet.");
	}

	// check existing users 
	var user = userHelper.getUser(state, message.author.username);
	if(user == undefined)
	{
		await message.reply("You did not sign up yet, therefore I cannot correct your positioning choice. Use '!join'-command to sign up.");
		return;
	}

	// check positions
	[res, positions, errormsg] = playerPositions.getNumbersFromMessage(message, 8);
	if (!res) {
		await message.reply(errormsg + formatString);
		return;
	}

	// correct user
	locker.acquireWriteLock(function () {
		user.positions = Array.from(positions);
		message.reply("Your signup positions now read " + user.positions.join(", "));
	});

	userHelper.printUsers(state);
}