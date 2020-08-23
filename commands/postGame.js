const c = require("../misc/constants")
const eC = require("../misc/answerEmbedding")
const mH = require("../misc/messageHelper")
const rM = require("../misc/roleManagement")
const lM = require("../misc/lobbyManagement")

/**
 * Checks if lobby exists and posts lobby post depending on lobby type
 * @param {*} message coaches message that triggered the lobby post
 * @param {*} state bot state
 */
async function postLobby(message, state) {
	
	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	if(type == c.lobbyTypes.inhouse)
	{
		postLobby_int(message, state, c.lobbyTypes.inhouse, c.getLobbyNameByType(c.lobbyTypes.inhouse), "Commands \r\n '!join inhouse 1,2,3,4,5' to join (replace with your positions) \r\n '!withdraw inhouse' to withdraw from the match (you can rejoin)\r\n '!status' to retrieve player status");
	} else if(type == c.lobbyTypes.mmr)
	{
		postLobby_int(message, state, c.lobbyTypes.mmr, c.getLobbyNameByType(c.lobbyTypes.mmr), "Commands \r\n '!join mmr' to join (replace with your positions) \r\n '!withdraw mmr' to withdraw from the match (you can rejoin)\r\n '!status' to retrieve player status");
	}
}

/**
 * Internal function that creates the embedding for the lobby post
 * @param {*} message coaches message that triggered the lobby post
 * @param {*} state bot state
 * @param {*} lobbyType type of lobby
 * @param {*} lobbyTypeName print name of lobby
 * @param {*} footer String to append to embedding
 */
function postLobby_int(message, state, lobbyType, lobbyTypeName, footer) {
	var channel = message.channel.id;

	if(lM.getLobby(state, channel, lobbyType) != undefined) {
		return mH.reactNegative(message, "Cannot override already created lobby of type "+ lobbyTypeName +" in channel <#" + message.channel.id + ">");
	}

	// get roles
	const minRole = 1;
	const maxRole = 4;
	[res, numbers, errormsg] = mH.getNumbersFromMessage(message, 1, minRole, maxRole);
	if(!res) {
		return mH.reactNegative(message, errormsg);
	}

	// get time
	[res, time, errormsg] = mH.getTimeFromMessage(message, 2);
	if(!res) {
		return mH.reactNegative(message, errormsg);
	}

	// create lobby
	lM.createLobby(state, channel, lobbyType, Array.from(numbers), time);

	// send embedding to lobby signup-channel
	var roles = rM.getRolesFromNumbers(numbers);
	const _embed = eC.generateEmbedding("We host a " + lobbyTypeName + " lobby at " + time, "for " + rM.getRoleStrings(roles), footer);
	
	mH.reactPositive(message);
	message.channel.send({embed: _embed});

}

module.exports = {
	postLobby: postLobby
}