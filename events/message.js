const pL = require("../commands/postLobby")
const rM = require("../misc/roleManagement")
const cM = require("../misc/channelManagement")
const mH = require("../misc/messageHelper")
const hU = require("../commands/helpUser")

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
	if (!cM.isWatchingChannel(message.channel.id)) {
		return mH.reactNegative(message, "I only listen to messages in the channels " + cM.channelStrings);
	}

	// help for admins
	if (rM.findRole(message.member, rM.adminRoles) != undefined) {
		if (content.startsWith("!help") || content.startsWith("!helpme")) {
			return hU(message);
		}
		if (content.startsWith("!post")) {
			return pL(message, client._state)
		}
	} else if (	content.startsWith("!post")) {
		return mH.reactNegative(message, "Only coaches are eligible for this command.");
	}
}