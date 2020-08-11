const eC = require("../misc/answerEmbedding")
const mH = require("../misc/messageHelper")
const rM = require("../misc/roleManagement")
const lM = require("../misc/lobbyManagement")

module.exports = async (message, state, client) => {
	
	if(lM.hasLobby(state)) {
		return message.reply("Already created a lobby today, won't override");
	}

	// get roles
	const minRole = 1;
	const maxRole = 4;
	[res, numbers, errormsg] = mH.getNumbersFromMessage(message, 5, minRole, maxRole);
	if(!res) {
		return message.reply(errormsg);
	}

	// create lobby
	lM.createLobby(state, Array.from(numbers));

	// send embedding to lobby signup-channel
	var roles = rM.getRolesFromNumbers(numbers);
	const _embed = eC.generateEmbedding("Tonight we host a lobby at 8pm CET", "for " + rM.getRoleStrings(roles), "Commands \r\n '!join 1,2,3,4,5' to join (replace with your positions) \r\n '!withdraw' to withdraw from the match (you can rejoin)\r\n '!status' to retrieve player status", 'success');
	const channel = await client.channels.get(process.env.LOBBY_SIGNUP_CHANNEL_ID);
	channel.send({embed: _embed});

}