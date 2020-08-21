const c = require("../misc/constants")
const eC = require("../misc/answerEmbedding")
const mH = require("../misc/messageHelper")
const rM = require("../misc/roleManagement")
const lM = require("../misc/lobbyManagement")

function postLobby(message, state){
	
	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	if(type == c.lobbyTypes.inhouse)
	{
		postLobby_int(message, state, c.lobbyTypes.inhouse, "Inhouse", "Commands \r\n '!join inhouse 1,2,3,4,5' to join (replace with your positions) \r\n '!withdraw inhouse' to withdraw from the match (you can rejoin)\r\n '!status' to retrieve player status");
	} else if(type == c.lobbyTypes.mmr)
	{
		postLobby_int(message, state, c.lobbyTypes.mmr, "MMR", "Commands \r\n '!join mmr' to join (replace with your positions) \r\n '!withdraw mmr' to withdraw from the match (you can rejoin)\r\n '!status' to retrieve player status");
	}
}

function postLobby_int(message, state, lobbyType, lobbyTypeName, footer) {
	var channel = message.channel.id;

	if(lM.hasLobby(state, channel, lobbyType)) {
		return message.reply("already created a lobby of type "+ lobbyTypeName +" today, in channel <#" + message.channel.id + "> won't override");
	}

	// get roles
	const minRole = 1;
	const maxRole = 4;
	[res, numbers, errormsg] = mH.getNumbersFromMessage(message, 1, minRole, maxRole);
	if(!res) {
		return message.reply(errormsg);
	}

	// get time
	[res, time, errormsg] = mH.getTimeFromMessage(message, 2);
	if(!res) {
		return message.reply(errormsg);
	}

	// create lobby
	lM.createLobby(state, channel, lobbyType, Array.from(numbers), time);

	// send embedding to lobby signup-channel
	var roles = rM.getRolesFromNumbers(numbers);
	const _embed = eC.generateEmbedding("We host an " + lobbyTypeName + " lobby at " + time, "for " + rM.getRoleStrings(roles), footer, 'success');
	message.channel.send({embed: _embed});
}

module.exports = {
	postLobby: postLobby
}