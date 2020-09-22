const lM = require("../misc/lobbyManagement")
const uH = require("../misc/userHelper")
const rM = require("../misc/roleManagement")
const c = require("../misc/constants")

/**
 * add reactions handling
 *
 * @param {*} client discord client
 * @param {*} reaction reaction to handle 
 * @param {*} user user who reacted
 */
module.exports = async (client, reaction, user) => {
    // only care for messages from self
	if (reaction.message.author.id !== process.env.BOT_ID) {
		return;
    }
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

    // check if it contains user
    if(!uH.userExists(lobby, user.id))
    {
        // get guild member (has role)
        const guildMember = await reaction.message.channel.guild.fetchMember(user.id);
        // get role
        var role = rM.findRole(guildMember, rM.beginnerRoles);
        if(role === undefined || role === null)
            return;

        var roleNumber = rM.getNumberFromBeginnerRole(role.id);
        if(lobby.tiers.find(tierNumber => tierNumber == roleNumber) === undefined)
            return;

        // add user
        uH.addUser( lobby,
                    user.username, 
                    user.id, 
                    [position],
                    role
        );

        // update lobby post
        lM.updateLobbyPost(lobby, reaction.message.channel);  
    } else {
        // add position
        var lobbyUser = uH.getUser(lobby, user.id);
      
        if(!lobbyUser.positions.includes(position))
        {
            lobbyUser.positions.push(position);
            lobbyUser.positions.sort();

            // update lobby post
            lM.updateLobbyPost(lobby, reaction.message.channel);  
        }
    } 
}