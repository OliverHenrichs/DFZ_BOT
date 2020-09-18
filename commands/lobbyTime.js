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
    
    [lobby, type] = mH.getLobbyAndType(state, message)
	if(lobby == undefined || type == undefined)
		return;
    
    var args = mH.getArguments(message);
    if(args.length < 2)
        return mH.reactNegative(message, "Specify timezone, e.g. !time <lobbytype> EST");

    [res, msg] = await tZ.getUserLobbyTime(lobby.date, args[1]);
    if(!res)
        return mH.reactNegative(message, msg);

    mH.reactPositive(message, "Lobby time is " + msg);
}