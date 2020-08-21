// channel management
module.exports = {
    // classes of roles
    botChannels: [process.env.BOT_LISTENING_CHANNEL_1, process.env.BOT_LISTENING_CHANNEL_2],
    channelStrings: "<#" + process.env.BOT_LISTENING_CHANNEL_1 + ">, <#" + process.env.BOT_LISTENING_CHANNEL_2 + ">",

    isWatchingChannel: function (channelId, channelIds) {
        return channelIds.includes(channelId);
    }
}