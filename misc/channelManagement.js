const bc = [process.env.BOT_LISTENING_CHANNEL_1, process.env.BOT_LISTENING_CHANNEL_2, process.env.BOT_LISTENING_CHANNEL_3, process.env.BOT_LISTENING_CHANNEL_4, process.env.BOT_LISTENING_CHANNEL_5]
const cs = "<#" + process.env.BOT_LISTENING_CHANNEL_1 + ">, <#" + process.env.BOT_LISTENING_CHANNEL_2 + ">, <#" + process.env.BOT_LISTENING_CHANNEL_3 + ">, <#" + process.env.BOT_LISTENING_CHANNEL_4+ ">, <#" + process.env.BOT_LISTENING_CHANNEL_5 + ">"

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