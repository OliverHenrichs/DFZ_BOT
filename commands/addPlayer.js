const rM = require("../misc/roleManagement")
const mH = require("../misc/messageHelper")
const locker = require("../misc/lock")
const lM = require("../misc/lobbyManagement")
const uH = require("../misc/userHelper")

var formatString = "\n Proper format is e.g. '!join inhouse 1,3,4' or '!join mmr 1' or '!join inhouse 5,2' or any other combination \n allowed numbers: 1,2,3,4,5 \n allowed lobby types: '"+Object.keys(lM.lobbyTypes).join("', '")+"'";

module.exports = async (message, state) => {

	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;

	// check existing lobby
	if(!lM.hasLobby(state, message.channel.id, type)) {
		return message.reply("no lobby scheduled for today, yet.");
	}

	var lobby = state.lobbies[message.channel.id][type];
	
	// check existing user
	if(uH.userExists(lobby, message.author.username))
		return message.reply("you have already signed up for the lobby");

	// check positions
	[res, positions, errormsg] = mH.getNumbersFromMessage(message, 1);
	if(!res)
		return message.reply(errormsg + formatString);
		

	// add user
	uH.addUser(	message, 
				lobby, 
				message.author.username, 
				message.author.id, 
				Array.from(positions), 
				rM.findRole(message, rM.beginnerRoles));

	// debug print
	uH.printUsers(state.lobbies[message.channel.id][type]);
}