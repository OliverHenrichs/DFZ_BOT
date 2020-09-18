const c = require("../misc/constants")
const lM = require("../misc/lobbyManagement")
const mH = require("../misc/messageHelper")
const locker = require("../misc/lock")
/**
 * Checks if lobby exists and removes lobby depending on lobby type
 * @param {*} message coaches message that triggered the lobby post
 * @param {*} state bot state
 */
module.exports = async (message, state) => {
    [lobby, type] = mH.getLobbyAndType(state, message)
	if(lobby == undefined || type == undefined)
		return;
    
    lM.cancelLobbyPost(lobby, message.channel);
	lM.removeLobby(state, message.channel.id, type);
    mH.reactPositive(message, "Removed " + c.getLobbyNameByType(type) + " lobby");
}