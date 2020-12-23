
const mH = require("../misc/messageHelper")
const lM = require("../misc/lobbyManagement")


/**
 * Checks if lobby exists and updates lobby post depending on message
 * @param {*} message coaches message that triggered the lobby update
 * @param {*} state bot state
 */
module.exports = async (message, state) => {
	var args = mH.getArguments(message);
	
	if(args.length == 0 || args == "")
	{
		reactNegative(message, "No message ID given. \r\n Add the message ID of the lobby you want to update.");
		return undefined;
	}

	[lobby, answer] = lM.getLobbyFromMessageId(args[0], message.channel.id, state);
	if(lobby === undefined)
		mH.reactNegative(message, answer);
		
	// remove message ID from args
	args.shift();
		
	
	//return mH.reactNegative(message, errormsg);
	[res, errormsg] = lM.updateLobbyParameters(args, lobby, message);
	if(res !== true)
		return mH.reactNegative(message, "Failed updating lobby parameters: " + errormsg);

	lM.updateLobbyPost(lobby, message.channel);
	return mH.reactPositive(message, "Updated lobby parameters.");
}