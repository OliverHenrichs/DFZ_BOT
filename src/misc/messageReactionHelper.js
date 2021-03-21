"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LobbyReactionInfo = void 0;
const cM = require("./channelManagement");
const lM = require("./lobbyManagement");
const rM = require("./roleManagement");
class LobbyReactionInfo {
    constructor(lobby, member, role) {
        this.lobby = lobby;
        this.member = member;
        this.role = role;
    }
}
exports.LobbyReactionInfo = LobbyReactionInfo;
/**
 * Extracts affected lobby, user who sent the message reaction and their role from a message reaction
 * returns false if the reaction does not fit the pattern
 * @param {DFZDiscordClient} client
 * @param {Discord.MessageReaction} reaction
 * @param {Discord.User} reaction
 */
async function getInfoFromLobbyReaction(client, reaction, user) {
    // find lobby
    const lobby = await lM.findLobbyByMessage(client.dbHandle, reaction.message.channel.id, reaction.message.id);
    var res = new LobbyReactionInfo(undefined, undefined, undefined);
    if (lobby === undefined)
        return res;
    // get guild member (has role)
    const guildMember = await reaction.message.guild?.members.fetch(user.id);
    // get role
    var role = rM.findRole(guildMember, rM.beginnerRoles);
    if (role === undefined || role === null) {
        role = rM.findRole(guildMember, rM.adminRoles);
    }
    if (role === undefined || role === null) {
        user.send("⛔ You cannot interact because you do not have the appropriate role.");
        return res;
    }
    res.lobby = lobby;
    res.member = guildMember;
    res.role = role;
    return res;
}
function isValidLobbyReaction(reaction, user) {
    // only care for messages from self
    if (reaction.message.author.id !== process.env.BOT_ID)
        return false;
    // ignore reactions from self
    if (user.id === process.env.BOT_ID)
        return false;
    // ignore bot's DMs
    if (reaction.message.channel === undefined)
        return false;
    // Ignore messages outside of bot channels
    if (!cM.isWatchingChannel(reaction.message.channel.id))
        return;
    return true;
}
module.exports = {
    isValidLobbyReaction: isValidLobbyReaction,
    getInfoFromLobbyReaction: getInfoFromLobbyReaction,
};
