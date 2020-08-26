const c = require("../misc/constants")
const tZ = require("../misc/timeZone")
const mH = require("../misc/messageHelper")
const lM = require("../misc/lobbyManagement")


/**
 * !time <lobby> Gives local time of lobby . Clears all players from given lobby
 * @param {*} message message that triggered this call
 * @param {*} state bot state
 */
module.exports = async (message, state) => {
	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

    var lobby = lM.getLobby(state, message.channel.id, type);
    if(lobby == undefined)
    {
        return mH.reactNegative(message, "No open "+c.getLobbyNameByType(type)+ " lobby yet.");
    }
    
    var args = mH.getArguments(message);
    if(args.length < 2)
        return mH.reactNegative(message, "Specify timezone, e.g. !time <lobbytype> EST");

    [res, msg] = await tZ.getUserLobbyTime(lobby.date, args[1]);
    if(!res)
        return mH.reactNegative(message, msg);

    mH.reactPositive(message, "Lobby time is " + msg);
}