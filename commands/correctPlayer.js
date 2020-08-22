const c = require("../misc/constants")
const locker = require("../misc/lock")
const mH = require("../misc/messageHelper")
const userHelper = require("../misc/userHelper")
const lM = require("../misc/lobbyManagement")

var formatString = "\n Proper format is e.g. '!correct inhouse 1,3,4' or '!correct mmr 1' or '!correct inhouse 5,2' or any other combination.\n allowed numbers: 1,2,3,4,5\n allowed lobby types: '"+Object.keys(c.lobbyTypes).join("', '")+"'";

/**
 * Handles user calls to !correct. Changes player position according to user wishes
 * @param {*} message user's message
 * @param {*} state bot state
 */
module.exports = async (message, state) => {
	
	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	var lobby = lM.getLobby(state, channel, type);
	if(lobby == undefined) {
		return message.reply("no open lobby of type " + lobbyType + " yet.");
	}

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

	userHelper.printLobbyUsers(state, message.channel.id, type);
}