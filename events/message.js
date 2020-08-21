const addPlayer = require("../commands/addPlayer")
const correctPlayer = require("../commands/correctPlayer")
const withdrawPlayer = require("../commands/withdrawPlayer")
const clearPlayers = require("../commands/clearPlayers")
const printPlayerStatus = require("../commands/printPlayerStatus")
const listPlayers = require("../commands/listPlayers")
const postGame = require("../commands/postGame")
const startGame = require("../commands/startGame")
const roleManagement = require("../misc/RoleManagement")
const channelManagement = require("../misc/ChannelManagement")
const lM = require("../misc/lobbyManagement")

const PREFIX = '!';

module.exports = async (client, message) => {
	// Ignore messages from self
	if (message.author.id === process.env.BOT_ID) {
		return;
	}

	// Ignore messages outside of bot channels
	if (!channelManagement.isWatchingChannel(message.channel.id, channelManagement.botChannels)) {
		await message.reply("I only listen to messages in the channels " + channelManagement.channelStrings);
		return;
	}

	// Get content
	const content = message.content;
  
	// Ignore any message that doesn't start with the correct prefix.
	if (!content.startsWith(PREFIX)) {
	  return;
	}

	// player messages
	if (roleManagement.findRole(message, roleManagement.beginnerRoles) != undefined) {
		if (content.startsWith("!join mmr")) {
			return addPlayer(message, client._state, lM.lobbyTypes.mmr)
		}
		if (content.startsWith("!join inhouse")) {
			return addPlayer(message, client._state, lM.lobbyTypes.inhouse)
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
	} else if (content.startsWith("!join") || content.startsWith("!withdraw") || content.startsWith("!correct") || content.startsWith("!status")) {
		await message.reply("Only Beginner Tiers 1,2,3 are eligible for this command.");
		return;
	}

	// admin messages
	if (roleManagement.findRole(message, roleManagement.adminRoles) != undefined) {
		if (content.startsWith("!post")) {
			return postGame.postLobby(message, client._state)
		}
		if (content.startsWith("!start")) {
			return startGame(message, client._state, client)
		}
		if (content.startsWith("!f_start")) {
			return startGame(message, client._state, client, true)
		}
		if (content.startsWith("!list")) {
			return listPlayers(message, client._state)
		}
		if (content.startsWith("!clear")) {
			return clearPlayers(message, client._state)
		}
	} else if (content.startsWith("!list") || content.startsWith("!clear")) {
		await message.reply("Only Coaches and Admins are eligible for this command.");
		return;
	}
}