const c = require("../misc/constants")
const aE = require("../misc/answerEmbedding")
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
	
	if(lM.getLobby(state, message.channel.id, lobbyType) !== undefined) {
		return mH.reactNegative(message, "Cannot override already created lobby of type "+ lobbyTypeName +" in channel <#" + message.channel.id + ">");
	}

	// tryout 'region' and role
	var lobbyRegionRole = undefined;
	var beginnerRoleNumbers = [0];

	if(lobbyType !== c.lobbyTypes.tryout)
	{
		// get region role
		var lobbyRegionRole = mH.getLobbyRegionRoleFromMessage(message, 1);
		if (lobbyRegionRole === undefined)
			return mH.reactNegative(message, "Failed to recognize region, has to be any of '" + rM.getRegionalRoleStringsForCommand().join("', '") + "'");

		// get beginner roles
		const minRole = 1;
		const maxRole = 4;
		[res, beginnerRoleNumbers, errormsg] = mH.getNumbersFromMessage(message, 2, minRole, maxRole);
		if(!res) {
			return mH.reactNegative(message, errormsg);
		}
	}

	var lobbyBeginnerRoles = rM.getBeginnerRolesFromNumbers(beginnerRoleNumbers);

	// get zoned time
	const tryoutIndex = 1;
	const allOtherTypesIndex = 3;
	[res, zonedTime, zoneName, errormsg] = await mH.getTimeFromMessage(message, lobbyType == c.lobbyTypes.tryout ? tryoutIndex : allOtherTypesIndex);
	if(!res) {
		return mH.reactNegative(message, errormsg);
	}

	// send embedding post to lobby signup-channel
	const _embed = aE.generateEmbedding("We host a " + lobbyTypeName + " lobby on " + tZ.getTimeString(zonedTime) + " " + zoneName,
										"for " + rM.getRoleMentions(lobbyBeginnerRoles) + (lobbyType !== c.lobbyTypes.tryout ? "\nRegion: "+ rM.getRoleMention(lobbyRegionRole) :"") ,
										footer + (lobbyType !== c.lobbyTypes.tryout ? ("\nPlayers from " + rM.getRegionalRoleString(lobbyRegionRole) + "-region will be moved up."):""));
	const lobbyPostMessage = await message.channel.send(rM.getRoleMentions(lobbyBeginnerRoles), {embed: _embed}); // mentioning roles in message again to ping beginners

	// pin message to channel
	lobbyPostMessage.pin();

	// add emojis
	mH.createLobbyPostReactions(lobbyType, lobbyPostMessage);

	// react to coach's command
	mH.reactPositive(message);

	// create lobby data in state
	lM.createLobby(state, message.channel.id, lobbyType, lobbyBeginnerRoles, lobbyRegionRole, zonedTime.epoch, lobbyPostMessage.id);
}

var reactionStringBeginner = "React to the numbers below to join the lobby at the ingame positions you want.\nRemove the reaction to remove the position.\nRemove all positions to withdraw from the lobby."
var reactionStringTryout = "React to the checkmark below to join the lobby.\nRemove the reaction to withdraw from the lobby."

/**
 * Checks if lobby exists and posts lobby post depending on lobby type
 * @param {*} message coaches message that triggered the lobby post
 * @param {*} state bot state
 */
module.exports = async (message, state) => {
	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	if(type == c.lobbyTypes.tryout)
		postLobby_int(message, state, type, c.getLobbyNameByType(type), reactionStringTryout);
	else
		postLobby_int(message, state, type, c.getLobbyNameByType(type), reactionStringBeginner);
}