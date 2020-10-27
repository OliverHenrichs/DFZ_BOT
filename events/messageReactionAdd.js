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

    var position = '-';
    if(lobby.type === c.lobbyTypes.tryout)
    {
        if(reaction.emoji.name !== c.tryoutReactionEmoji)
            return;
    } else {
        // get position
        position = c.getReactionEmojiPosition(reaction.emoji);
        if(position === 0)
            return;
    }

    // check if it contains user
    if(!uH.userExists(lobby, user.id))
    {
        // get guild member (has role)
        const guildMember = await reaction.message.channel.guild.fetchMember(user.id);

        // get beginner role
        var beginnerRole = rM.findRole(guildMember, rM.beginnerRoles);
        if(beginnerRole === undefined || beginnerRole === null)
        {
            await user.send("⛔ You cannot join because you do not have a beginner role.");
            return;
        }

        if(lobby.beginnerRoleIds.find(roleId => roleId == beginnerRole.id) === undefined)
        {
            await user.send("⛔ You cannot join yet because you do not have a suitable beginner role.");
            return;
        }

        // get region role
        var regionRole = rM.findRole(guildMember, rM.regionRoleIDs);

        // add user
        uH.addUser( lobby,
                    user.username, 
                    user.id, 
                    [position],
                    beginnerRole, 
                    regionRole
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