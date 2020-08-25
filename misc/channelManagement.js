const bc = [process.env.BOT_LISTENING_CHANNEL_1, process.env.BOT_LISTENING_CHANNEL_2]
const cs = "<#" + process.env.BOT_LISTENING_CHANNEL_1 + ">, <#" + process.env.BOT_LISTENING_CHANNEL_2 + ">"

// channel management
module.exports = {
    // classes of roles
    botChannels: bc,
    channelStrings: cs,

    /**
     * checks 
     * @param {string} channelId 
     * @param {[string]} channelIds 
     */
    isWatchingChannel: function (channelId) {
        return bc.includes(channelId);
    }
}