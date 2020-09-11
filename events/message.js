const addPlayer = require("../commands/addPlayer")
const correctPlayer = require("../commands/correctPlayer")
const withdrawPlayer = require("../commands/withdrawPlayer")
const clearPlayers = require("../commands/clearPlayers")
const printPlayerStatus = require("../commands/printPlayerStatus")
const listPlayers = require("../commands/listPlayers")
const postLobby = require("../commands/postLobby")
const startLobby = require("../commands/startLobby")
const roleManagement = require("../misc/roleManagement")
const channelManagement = require("../misc/channelManagement")
const removeLobby = require("../commands/removeLobby")
const mH = require("../misc/messageHelper")
const helpUser = require("../commands/helpUser")
const timeZone = require("../commands/lobbyTime")

const PREFIX = '!';

/**
 * Main message handler 
 * Filters messages and calls all command subroutines 
 * @param {*} client discord client
 * @param {*} message message to handle 
 */
module.exports = async (client, message) => {
	
	// Get content
	const content = message.content;

	// Ignore any message that doesn't start with the correct prefix.
	if (!content.startsWith(PREFIX)) {
		return;
	}

	// Ignore messages from self
	if (message.author.id === process.env.BOT_ID) {
		return;
	}

	// Ignore messages outside of bot channels
	if (!channelManagement.isWatchingChannel(message.channel.id)) {
		return mH.reactNegative(message, "I only listen to messages in the channels " + channelManagement.channelStrings);
	}

	// player messages
	if (roleManagement.findRole(message.member, roleManagement.beginnerRoles) != undefined) {
		if (content.startsWith("!help") || content.startsWith("!helpme")) {
			return helpUser(message);
		}
		if (content.startsWith("!join")) {
			return addPlayer(message, client._state)
		}
		if (content.startsWith("!withdraw")) {
			return withdrawPlayer(message, client._state)
		}
		if (content.startsWith("!correct")) {
			return correctPlayer(message, client._state)
		}
		if (content.startsWith("!status")) {
			return printPlayerStatus(message, client._state)
		}
		if (content.startsWith("!time")) {
			return timeZone(message, client._state);
		}
	} else if (	content.startsWith("!join") || 
				content.startsWith("!withdraw") || 
				content.startsWith("!correct") || 
				content.startsWith("!status")) 
	{
		return mH.reactNegative(message, "Only Beginner Tiers 1,2,3 are eligible for this command.");
	}

	// admin messages
	if (roleManagement.findRole(message.member, roleManagement.adminRoles) != undefined) {
		if (content.startsWith("!help") || content.startsWith("!helpme")) {
			return helpUser(message);
		}
		if (content.startsWith("!post")) {
			return postLobby(message, client._state)
		}
		if (content.startsWith("!start")) {
			return startLobby(message, client._state)
		}
		if (content.startsWith("!f_start")) {
			return startLobby(message, client._state, true)
		}
		if (content.startsWith("!list")) {
			return listPlayers(message, client._state)
		}
		if (content.startsWith("!clear")) {
			return clearPlayers(message, client._state)
		}
		if (content.startsWith("!undo")) {
			return removeLobby(message, client._state)
		}
		if (content.startsWith("!time")) {
			return timeZone(message, client._state);
		}
	} else if (	content.startsWith("!post") || 
				content.startsWith("!start") || 
				content.startsWith("!f_start") || 
				content.startsWith("!list") || 
				content.startsWith("!clear") || 
				content.startsWith("!undo")) {
		return mH.reactNegative(message, "Only coaches and admins are eligible for this command.");
	}
}