const locker = require("../misc/lock")
const mH = require("../misc/messageHelper")
const userHelper = require("../misc/userHelper")
const lM = require("../misc/lobbyManagement")

var formatString = "\n Proper format is e.g. '!correct 1,3,4' or '!correct 1' or '!correct 5,2' or any other combination (allowed numbers 1,2,3,4,5)";

module.exports = async (message, state) => {
	
	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	if(!lM.hasLobby(state, message.channel.id, type))
	{
		await message.reply("no open lobby of type " + lobbyType + " yet.");
		return;
	}

	var lobby = state.lobbies[message.channel.id][type];

	// check existing users 
	var user = userHelper.getUser(lobby, message.author.username);
	if(user == undefined)
	{
		await message.reply("you did not sign up yet, therefore I cannot correct your positioning choice. Use '!join'-command to sign up.");
		return;
	}

	// check positions
	[res, positions, errormsg] = mH.getNumbersFromMessage(message, 1);
	if (!res) {
		await message.reply(errormsg + formatString);
		return;
	}

	// correct user
	locker.acquireWriteLock(function () {
		user.positions = Array.from(positions);
		message.reply("your signup positions now read " + user.positions.join(", "));
	}, function() {
		console.log("lock released in correctPlayer");
	});

	userHelper.printUsers(state.lobbies[message.channel.id][type]);
}