const dB = require("../misc/database")
const lM = require("../misc/lobbyManagement")
const mrH = require("../misc/messageReactionHelper")
const uH = require("../misc/userHelper")
const rM = require("../misc/roleManagement")
const cM = require("../misc/channelManagement")
const sM = require("../misc/scheduleManagement")
const c = require("../misc/constants");

/**
 * Adds user to lobby or adds position to user in lobby
 * @param {Discord.User} user discord-user
 * @param {int} position dota-position
 * @param {string} beginnerRole player tier role
 * @param {string} regionRole player region role
 * @param {JSON} lobby lobby player wants to join
 * @param {Discord.Channel} channel text channel of lobby
 * @returns true if lobby has been changed, false if not
 */
function addUserOrPosition(user, position, beginnerRole, regionRole, lobby, channel) {
    // check if it contains user
    if(!uH.userExists(lobby, user.id)) {
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
        return true;
    } else {
        // add position
        var lobbyUser = uH.getUser(lobby, user.id);
    
        if(!lobbyUser.positions.includes(position))
        {
            lobbyUser.positions.push(position);
            lobbyUser.positions.sort();

            // update lobby post
            lM.updateLobbyPost(lobby, channel);   
            return true;
        }
    } 
    return false;
}

/**
 * Checks if player is suitable beginner, and if, then adds player or adds position according to reaction emoji
 * @param {JSON} lobby lobby to which the user reacted
 * @param {Discord.User} user discord-user
 * @param {Discord.MessageReaction} reaction reaction with which the user reacted
 * @param {string} role role of the user
 * @param {Discord.Member} guildMember member of the user
 * @returns true if lobby was changed
 */
function handlePositionEmoji(lobby, user, reaction, role, guildMember) {
    // dont do tryout
    if(lobby.type === c.lobbyTypes.tryout)
        return false;

    if(lobby.beginnerRoleIds.find(roleId => roleId == role.id) === undefined) {
        user.send("⛔ You cannot join because you do not have a suitable beginner role.");
        return false;
    }
    // get position
    var position = c.getReactionEmojiPosition(reaction.emoji);
    if(position === 0)
        return false;
        
    // get region role
    var regionRole = rM.findRole(guildMember, rM.regionRoleIDs);
     
    return addUserOrPosition(user, position, role, regionRole, lobby, reaction.message.channel);
}

/**
 * Checks if player is tryout, and if, then adds player
 * @param {JSON} lobby lobby to which the user reacted
 * @param {Discord.User} user discord-user
 * @param {Discord.MessageReaction} reaction reaction with which the user reacted
 * @param {string} role role of the user
 * @returns true if lobby was changed
 */
function handleTryoutEmoji(lobby, user, reaction, role) {
    if(lobby.type !== c.lobbyTypes.tryout)
        return false;

    if(role.id !== process.env.TRYOUT) {
        user.send("⛔ You cannot join because you do not have the tryout role.");
        return false;
    }
    
    return addUserOrPosition(user, '-', role, undefined, lobby, reaction.message.channel);
}

/**
 * Checks if player is coach, and if, then removes or starts lobby
 * @param {Discord.Client} client 
 * @param {JSON} lobby lobby in question
 * @param {Discord.User} user discord-user
 * @param {Discord.MessageReaction} reaction reaction with which the user reacted
 * @param {Discord.Role} role role of the user
 */
async function handleLobbyManagementEmoji(client, lobby, user, reaction, role) {
    if(rM.adminRoles.find(roleId => roleId == role.id) === undefined) {
        user.send("⛔ Only Coaches can use these functions.");
        return;
    }

    if(reaction.emoji.name === '🔒') {
        if(lM.startLobby(client, lobby, user, reaction.message.channel))
            lM.removeLobby(client.dbHandle, lobby);
    }
    else if(reaction.emoji.name ==='❌') {
        await lM.cancelLobbyPost(lobby, reaction.message.channel);
        lM.removeLobby(client.dbHandle, lobby);
        user.send("❌ I cancelled the lobby.");
    }
    else if(reaction.emoji.name ==='🧑‍🏫') {
        lM.addCoach(client.dbHandle, reaction.message.channel, lobby, user.id)
        .then(()=>user.send("✅ Added you as a coach!"))
        .catch(error => user.send("⛔ I did not add you as a coach. Reason: " + error))            
    }
}

/**
 * Handles reactions that will change existing posted lobbies
 * @param {Discord.Client} client 
 * @param {Discord.MessageReaction} reaction 
 * @param {Discord.User} user 
 */
async function handleLobbyRelatedEmoji(client, reaction, user) {
    [res, lobby, guildMember, role] = await mrH.getInfoFromLobbyReaction(client, reaction, user);
    if(!res)
        return;

    changedLobby = false;
    // handle adding users 
    if(c.isKnownPositionEmoji(reaction.emoji))
        changedLobby = handlePositionEmoji(lobby, user, reaction, role, guildMember);
    else if(c.isKnownTryoutEmoji(reaction.emoji))
        changedLobby = handleTryoutEmoji(lobby, user, reaction, role);
    else if(c.isKnownLobbyManagementEmoji(reaction.emoji)) {// handle lobby management => will delete lobby if x-ed or started => no need to update => just return
        return handleLobbyManagementEmoji(client, lobby, user, reaction, role);
    }

    if(changedLobby)
        await dB.updateLobby(client.dbHandle, lobby);
}

/**
 * add reactions handling
 *
 * @param {Discord.Client} client discord client
 * @param {Discord.MessageReaction} reaction reaction to handle 
 * @param {Discord.User} user user who reacted
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
	if (!cM.isWatchingChannel(reaction.message.channel.id))
		return;

    if(reaction.message.channel.id === cM.scheduleChannelTryout || reaction.message.channel.id === cM.scheduleChannel5v5)
        return await sM.addCoach(client, reaction, user);
     
    return await handleLobbyRelatedEmoji(client, reaction, user);
}