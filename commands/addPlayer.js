const rM = require("../misc/roleManagement")
const mH = require("../misc/messageHelper")
const locker = require("../misc/lock")
const lM = require("../misc/lobbyManagement")
const uH = require("../misc/userHelper")

var formatString = "\n Proper format is e.g. '!join 1,3,4' or '!join 1' or '!join 5,2' or any other combination (allowed numbers 1,2,3,4,5)";

module.exports = async (message, state) => {
	// check existing lobby
	if(!lM.hasLobby(state)) {
		return message.reply("No lobby scheduled for today, yet.");
	}
	
	// check existing user
	if(uH.userExists(state, message.author.username))
		return message.reply("You have already signed up for the lobby");

	// check positions
	[res, positions, errormsg] = mH.getNumbersFromMessage(message, 5);
	if(!res)
		return message.reply(errormsg + formatString);
		

	// add user
	uH.addUser(	message, 
				state, 
				message.author.username, 
				message.author.id, 
				Array.from(positions), 
				rM.findRole(message, rM.beginnerRoles));

	// debug print
	uH.printUsers(state);
}