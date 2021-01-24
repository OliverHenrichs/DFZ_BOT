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

module.exports.getInfoFromLobbyReaction = getInfoFromLobbyReaction;