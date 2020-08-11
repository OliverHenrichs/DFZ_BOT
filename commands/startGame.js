const lM = require("../misc/lobbyManagement")

module.exports = async (message, state, client, force=false) => {
	
	if(!lM.hasLobby(state)) {
		return message.reply("No lobby has been created yet");
    }
    
    if(state.lobby.users.length < 10 && !force)
         return message.reply("There are less than 10 players signed up. Cannot start yet");

	// create lobby
	lM.createLobbyPost(state, client);
}