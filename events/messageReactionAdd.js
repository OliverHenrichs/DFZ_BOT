const lM = require("../misc/lobbyManagement")
const uH = require("../misc/userHelper")
const rM = require("../misc/roleManagement")
const cM = require("../misc/channelManagement")
const c = require("../misc/constants");
const channelManagement = require("../misc/channelManagement");

/**
 * Adds user to lobby or adds position to user in lobby
 * @param {*} user discord-user
 * @param {*} position dota-position
 * @param {*} beginnerRole player tier role
 * @param {*} regionRole player region role
 * @param {*} lobby lobby player wants to join
 * @param {*} channel text channel of lobby
 */
function addUserOrPosition(user, position, beginnerRole, regionRole, lobby, channel) {
    // check if it contains user
    if(!uH.userExists(lobby, user.id))
    {
        // add user
        uH.addUser( lobby,
                    user.username, 
                    user.id, 
                    [position],
                    beginnerRole, 
                    regionRole
        );

        // update lobby post
        lM.updateLobbyPost(lobby, channel);  
    } else {
        // add position
        var lobbyUser = uH.getUser(lobby, user.id);
    
        if(!lobbyUser.positions.includes(position))
        {
            lobbyUser.positions.push(position);
            lobbyUser.positions.sort();

            // update lobby post
            lM.updateLobbyPost(lobby, channel);  
        }
    } 
}

/**
 * Checks if player is suitable beginner, and if, then adds player or adds position according to reaction emoji
 * @param {*} lobby lobby to which the user reacted
 * @param {*} user discord-user
 * @param {*} reaction reaction with which the user reacted
 * @param {*} role role of the user
 * @param {*} guildMember member of the user
 */
function handlePositionEmoji(lobby, user, reaction, role, guildMember)
{
    // dont do tryout
    if(lobby.type === c.lobbyTypes.tryout)
        return

    if(lobby.beginnerRoleIds.find(roleId => roleId == role.id) === undefined)
    {
        user.send("⛔ You cannot join because you do not have a suitable beginner role.");
        return;
    }
    
    // get region role
    var regionRole = rM.findRole(guildMember, rM.regionRoleIDs);

    // get position
    var position = c.getReactionEmojiPosition(reaction.emoji);
    if(position === 0)
        return;
     
    addUserOrPosition(user, position, role, regionRole, lobby, reaction.message.channel);
}

/**
 * Checks if player is tryout, and if, then adds player
 * @param {*} lobby lobby to which the user reacted
 * @param {*} user discord-user
 * @param {*} reaction reaction with which the user reacted
 * @param {*} role role of the user
 */
function handleTryoutEmoji(lobby, user, reaction, role)
{
    if(lobby.type !== c.lobbyTypes.tryout)
        return;

    if(role.id !== process.env.TRYOUT)
    {
        user.send("⛔ You cannot join because you do not have the tryout role.");
        return;
    }
    
    addUserOrPosition(user, '-', role, undefined, lobby, reaction.message.channel);
}

/**
 * Checks if player is coach, and if, then removes or starts lobby
 * @param {*} client discord client
 * @param {*} lobby lobby in question
 * @param {*} user discord-user
 * @param {*} reaction reaction with which the user reacted
 * @param {*} role role of the user
 */
function handleLobbyManagementEmoji(client, lobby, user, reaction, role)
{
    if(rM.adminRoles.find(roleId => roleId == role.id) === undefined)
    {
        user.send("⛔ Only Coaches can use these functions.");
        return;
    }

    if(reaction.emoji.name === '🔒')
    {
        if(lM.startLobby(client, lobby, user, reaction.message.channel))
            lM.removeLobby(client._state, reaction.message.channel.id, lobby);
    }
    else if(reaction.emoji.name ==='❌')
    {
        lM.cancelLobbyPost(lobby, reaction.message.channel);
        lM.removeLobby(client._state, reaction.message.channel.id, lobby);
        user.send("❌ I cancelled the lobby.");
    }
}

/**
 * add reactions handling
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
    if(user.id === process.env.BOT_ID)
        return;

    // ignore bot's DMs
    if(reaction.message.channel === undefined)
        return;

    // Ignore messages outside of bot channels
	if (!cM.isWatchingChannel(reaction.message.channel.id)) {
		return;
    }
    
    // find lobby
    var lobby = lM.findLobbyByMessage(client._state, reaction.message.channel.id, reaction.message.id);
    if(lobby == undefined)
        return;

    // get guild member (has role)
    const guildMember = await reaction.message.channel.guild.fetchMember(user.id);

    // get role
    var role = rM.findRole(guildMember, rM.beginnerRoles);
    if(role === undefined || role === null) {
        role = rM.findRole(guildMember, rM.adminRoles);
    }
    
    if(role === undefined || role === null)
    {
        user.send("⛔ You cannot interact because you do not have the appropriate role.");
        return;
    }

    // handle adding users 
    if(c.isKnownPostitionEmoji(reaction.emoji))
    {
        return handlePositionEmoji(lobby, user, reaction, role, guildMember);
    }

    if(c.isKnownTryoutEmoji(reaction.emoji))
    {
        return handleTryoutEmoji(lobby, user, reaction, role);
    }

    // handle lobby management
    if(c.isKnownLobbyManagementEmoji(reaction.emoji))
    {
        return handleLobbyManagementEmoji(client, lobby, user, reaction, role);
    }
}