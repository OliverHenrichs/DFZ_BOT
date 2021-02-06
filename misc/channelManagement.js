
const bc = [process.env.BOT_LOBBY_CHANNEL_EU, process.env.BOT_LOBBY_CHANNEL_NA, process.env.BOT_LOBBY_CHANNEL_SEA, process.env.BOT_LOBBY_CHANNEL_TRYOUT, process.env.BOT_LOBBY_CHANNEL_TEST, process.env.BOT_LOBBY_CHANNEL_BOT_BASH]
const cs = "<#" + process.env.BOT_LOBBY_CHANNEL_1 + ">, <#" + process.env.BOT_LOBBY_CHANNEL_2 + ">, <#" + process.env.BOT_LOBBY_CHANNEL_3 + ">, <#" + process.env.BOT_LOBBY_CHANNEL_4+ ">, <#" + process.env.BOT_LOBBY_CHANNEL_5 + ">, <#" + process.env.BOT_LOBBY_CHANNEL_BOT_BASH + ">"

// channel management
module.exports = {
    scheduleChannelTryout: process.env.BOT_SCHEDULE_CHANNEL_TRYOUT,
    scheduleChannel5v5: process.env.BOT_SCHEDULE_CHANNEL_5V5,
    botChannels: bc,
    channelStrings: cs,

    /**
     * checks 
     * @param {string} channelId 
     * @param {[string]} channelIds 
     */
    isWatchingChannel: function (channelId) {
        return bc.includes(channelId) || channelId === this.scheduleChannelTryout || channelId ===  this.scheduleChannel5v5;
    }
}