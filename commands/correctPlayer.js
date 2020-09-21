const c = require("../misc/constants")
const mH = require("../misc/messageHelper")
const uH = require("../misc/userHelper")
const lM = require("../misc/lobbyManagement")

var formatString = "\n Proper format is e.g. '!correct inhouse 1,3,4' or '!correct unranked 1' or '!correct inhouse 5,2' or any other combination.\n allowed numbers: 1,2,3,4,5\n allowed lobby types: '"+Object.keys(c.lobbyTypes).join("', '")+"'";

/**
 * Handles user calls to !correct. Changes player position according to user wishes
 * @param {*} message user's message
 * @param {*} state bot state
 */
module.exports = async (message, state) => {
	
	[lobby, type] = mH.getLobbyAndType(state, message)
	if(lobby == undefined || type == undefined)
		return;

	// check existing users 
	var user = uH.getUser(lobby, message.author.id);
	if(user == undefined)
	{
		return mH.reactNegative(message, "you did not sign up yet, therefore I cannot correct your positioning choice. Use '!join'-command to sign up.");
	}

	// check positions
	[res, positions, errormsg] = mH.getNumbersFromMessage(message, 1);
	if (!res) {
		return mH.reactNegative(message, errormsg + formatString);
	}

	// correct user
	user.positions = Array.from(positions);
	mH.reactPositive(message, "your signup positions now read " + user.positions.join(", "));
	
	// update lobby post
	lM.updateLobbyPost(lobby, message.channel);
}