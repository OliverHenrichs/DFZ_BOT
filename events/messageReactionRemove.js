const lM = require("../misc/lobbyManagement")
const cM = require("../misc/channelManagement") 
const c = require("../misc/constants") 
const mrH = require("../misc/messageReactionHelper") 
const rM = require("../misc/roleManagement")
const sM = require("../misc/scheduleManagement")


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

    if(rM.adminRoles.includes(role.id) && reaction.emoji.name === c.lobbyManagementReactionEmojis[2]) {
        lM.removeCoach(client.dbHandle, reaction.message.channel, lobby, user.id)
        .then(()=>user.send("✅ Removed you as a coach!"))
        .catch(error => user.send("⛔ I could not remove you as a coach. Reason: " + error))  
    }
    else // if not admin, then it was a user
        lM.updatePlayerInLobby(client.dbHandle, reaction, lobby, user)   
}

/**
 * remove reactions handling
 *
 * @param {Discord.Client} client discord client
 * @param {Discord.MessageReaction} reaction reaction to handle 
 * @param {Discord.User} user user who reacted
 */
module.exports = async (client, reaction, user) => {
    if(!mrH.isValidLobbyReaction(reaction, user))
        return;
    
    if(reaction.message.channel.id === cM.scheduleChannelTryout || reaction.message.channel.id === cM.scheduleChannel5v5) {
        sM.removeCoachFromSchedule(client, reaction, user);
    } else // something with a lobby post
    {
        await handleLobbyRelatedEmoji(client, reaction, user)
    }
             
}