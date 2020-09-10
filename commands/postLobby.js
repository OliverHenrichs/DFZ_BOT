const c = require("../misc/constants")
const eC = require("../misc/answerEmbedding")
const mH = require("../misc/messageHelper")
const rM = require("../misc/roleManagement")
const lM = require("../misc/lobbyManagement")
const tZ = require("../misc/timeZone")

/**
 * Internal function that creates the embedding for the lobby post
 * @param {*} message coaches message that triggered the lobby post
 * @param {*} state bot state
 * @param {*} lobbyType type of lobby
 * @param {*} lobbyTypeName printing name of that lobby
 * @param {*} footer String to append to embedding
 */
async function postLobby_int(message, state, lobbyType, lobbyTypeName, footer) {
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
	[res, date, errormsg] = await mH.getTimeFromMessage(message, 2);
	if(!res) {
		return mH.reactNegative(message, errormsg);
	}


	// send embedding post to lobby signup-channel
	var roles = rM.getRolesFromNumbers(numbers);
	const _embed = eC.generateEmbedding("We host a " + lobbyTypeName + " lobby on " + tZ.weekDays[date.dayOfWeek] + ", "+tZ.months[date.month]+" "+ date.day +" at " + date.hours +":00" + " " + date.zone.abbreviation, "for " + rM.getRoleStrings(roles), footer);
	const lobbyPostMessage = await message.channel.send({embed: _embed});

	// pin message to channel
	lobbyPostMessage.pin();

	// create lobby data in state
	lM.createLobby(state, channel, lobbyType, Array.from(numbers), date, lobbyPostMessage.id);
	
	// react to message
	mH.reactPositive(message);

}

/**
 * Checks if lobby exists and posts lobby post depending on lobby type
 * @param {*} message coaches message that triggered the lobby post
 * @param {*} state bot state
 */
module.exports = async (message, state) => {
	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	if(type == c.lobbyTypes.inhouse)
	{
		postLobby_int(message, state, c.lobbyTypes.inhouse, c.getLobbyNameByType(c.lobbyTypes.inhouse), "Commands \r\n '!join inhouse 1,2,3,4,5' to join (replace with your positions) \r\n '!withdraw inhouse' to withdraw from the match (you can rejoin)\r\n '!status' to retrieve player status");
	} else if(type == c.lobbyTypes.unranked)
	{
		postLobby_int(message, state, c.lobbyTypes.unranked, c.getLobbyNameByType(c.lobbyTypes.unranked), "Commands \r\n '!join unranked 1,2,3,4,5' to join (replace with your positions) \r\n '!withdraw unranked' to withdraw from the match (you can rejoin)\r\n '!status' to retrieve player status");
	}else if(type == c.lobbyTypes.botbash)
	{
		postLobby_int(message, state, c.lobbyTypes.botbash, c.getLobbyNameByType(c.lobbyTypes.botbash), "Commands \r\n '!join unranked 1,2,3,4,5' to join (replace with your positions) \r\n '!withdraw unranked' to withdraw from the match (you can rejoin)\r\n '!status' to retrieve player status");
	}
}