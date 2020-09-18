const rM = require("../misc/roleManagement")
const mH = require("../misc/messageHelper")
const lM = require("../misc/lobbyManagement")
const uH = require("../misc/userHelper")
const c = require("../misc/constants")

var formatString = "\n Proper format is e.g. '!join inhouse 1,3,4' or '!join unranked 1' or '!join inhouse 5,2' or any other combination \n allowed numbers: 1,2,3,4,5 \n allowed lobby types: '"+Object.keys(c.lobbyTypes).join("', '")+"'";

/**
 * Handles a user's call to !join. Adds user to lobby given the message's lobby type and its channel id
 * @param message the message given by the user
 * @param state the bot's state
 */
module.exports = async (message, state) => {

	[lobby, type] = mH.getLobbyAndType(state, message)
	if(lobby == undefined || type == undefined)
		return;
		
	// check existing user
	if(uH.userExists(lobby, message.author.id)) 
		return mH.reactNegative(message, "you have already signed up for that lobby");

	// check positions
	[res, positions, errormsg] = mH.getNumbersFromMessage(message, 1);
	if(!res)
		return mH.reactNegative(message, errormsg + formatString);
		

	// add user
	var posArray = Array.from(positions);
	uH.addUser(	lobby,
				message.author.username, 
				message.author.id, 
				posArray, 
				rM.findRole(message.member, rM.beginnerRoles));

	mH.reactPositive(message, "added you for tonight's "+ c.getLobbyNameByType(type) +" lobby for positions " + posArray.join(", "));

	// update lobby post
	lM.updateLobbyPost(lobby,message.channel);
}