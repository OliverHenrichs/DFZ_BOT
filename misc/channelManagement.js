const lc = [process.env.BOT_LOBBY_CHANNEL_EU, process.env.BOT_LOBBY_CHANNEL_NA, process.env.BOT_LOBBY_CHANNEL_SEA, process.env.BOT_LOBBY_CHANNEL_TRYOUT, process.env.BOT_LOBBY_CHANNEL_TEST, process.env.BOT_LOBBY_CHANNEL_BOTBASH]
const sc = [process.env.BOT_SCHEDULE_CHANNEL_BOTBASH, process.env.BOT_SCHEDULE_CHANNEL_TRYOUT, process.env.BOT_SCHEDULE_CHANNEL_5V5];
const cs = "<#" + process.env.BOT_LOBBY_CHANNEL_1 + ">, <#" + process.env.BOT_LOBBY_CHANNEL_2 + ">, <#" + process.env.BOT_LOBBY_CHANNEL_3 + ">, <#" + process.env.BOT_LOBBY_CHANNEL_4+ ">, <#" + process.env.BOT_LOBBY_CHANNEL_5 + ">, <#" + process.env.BOT_LOBBY_CHANNEL_BOTBASH + ">"

// channel management
module.exports = {
    scheduleChannelBotbash: process.env.BOT_SCHEDULE_CHANNEL_BOTBASH,
    scheduleChannelTryout: process.env.BOT_SCHEDULE_CHANNEL_TRYOUT,
    scheduleChannel5v5: process.env.BOT_SCHEDULE_CHANNEL_5V5,
    scheduleChannels: sc,
    lobbyChannels: lc,
    channelStrings: cs,

    /**
     * checks 
     * @param {string} channelId 
     * @param {[string]} channelIds 
     */
    isWatchingChannel: function (channelId) {
        return lc.includes(channelId) || sc.includes(channelId);
    }
}