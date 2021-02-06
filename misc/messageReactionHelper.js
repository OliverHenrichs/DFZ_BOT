const cM = require("../misc/channelManagement")
const lM = require("../misc/lobbyManagement")
const rM = require("../misc/roleManagement")

/**
 * Extracts affected lobby, user who sent the message reaction and their role from a message reaction
 * returns false if the reaction does not fit the pattern
 * @param {Discord.Client} client 
 * @param {Discord.MessageReaction} reaction 
 * @param {Discord.User} reaction 
 */
async function getInfoFromLobbyReaction(client, reaction, user) {
    // find lobby
    var lobby = await lM.findLobbyByMessage(client.dbHandle, reaction.message.channel.id, reaction.message.id)
            
    if(lobby === undefined)
        return [false, undefined, undefined, undefined];

    // get guild member (has role)
    const guildMember = await reaction.message.channel.guild.fetchMember(user.id);

    // get role
    var role = rM.findRole(guildMember, rM.beginnerRoles);
    if(role === undefined || role === null) {
        role = rM.findRole(guildMember, rM.adminRoles);
    }

    if(role === undefined || role === null) {
        user.send("⛔ You cannot interact because you do not have the appropriate role.");
        return [false, undefined, undefined, undefined];
    }

    return [true, lobby, guildMember, role];
}

function isValidLobbyReaction(reaction, user) {
    
    // only care for messages from self
	if (reaction.message.author.id !== process.env.BOT_ID) 
        return false;

    // ignore reactions from self
    if(user.id === process.env.BOT_ID)
        return false;

    // ignore bot's DMs
    if(reaction.message.channel === undefined)
        return false;

    // Ignore messages outside of bot channels
	if (!cM.isWatchingChannel(reaction.message.channel.id))
        return;

    return true;
}

module.exports.isValidLobbyReaction = isValidLobbyReaction;
module.exports.getInfoFromLobbyReaction = getInfoFromLobbyReaction;