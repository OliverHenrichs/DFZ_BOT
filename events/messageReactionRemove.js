const lM = require("../misc/lobbyManagement")
const uH = require("../misc/userHelper")
const c = require("../misc/constants")

/**
 * remove reactions handling
 *
 * @param {*} client discord client
 * @param {*} reaction reaction to handle 
 * @param {*} user user who reacted
 */
module.exports = async (client, reaction, user) => {
    // only care for messages from self
	if (reaction.message.author.id !== process.env.BOT_ID)
		return;
    
    // ignore reactions from self
    if(user.id == process.env.BOT_ID)
        return;

    // ignore bot's DMs
    if(reaction.message.channel === undefined)
        return;

    // find lobby
    var lobby = lM.findLobbyByMessage(client._state, reaction.message.channel.id, reaction.message.id);
    if(lobby == undefined)
        return;

    // get position
    var position = c.getReactionEmojiPosition(reaction.emoji);
    if(position === 0)
        return;

    // check if lobby contains user
    var lobbyUser = uH.getUser(lobby, user.id);
    if(lobbyUser === undefined)
        return;
   
    // remove user position
    lobbyUser.positions = lobbyUser.positions.filter(_position=> {
        return _position != position;
    });

    // remove user if no positions left
    if(lobbyUser.positions.length === 0)
    {
        var idx = lobby.users.findIndex(_user => _user.id == user.id);
        lobby.users.splice(idx,1);
    }

    // update lobby post
    lM.updateLobbyPost(lobby, reaction.message.channel);  
}