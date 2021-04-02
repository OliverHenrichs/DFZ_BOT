const lc = [
  process.env.BOT_LOBBY_CHANNEL_EU,
  process.env.BOT_LOBBY_CHANNEL_NA,
  process.env.BOT_LOBBY_CHANNEL_SEA,
  process.env.BOT_LOBBY_CHANNEL_TRYOUT,
  process.env.BOT_LOBBY_CHANNEL_TEST,
  process.env.BOT_LOBBY_CHANNEL_BOTBASH,
  process.env.BOT_LOBBY_CHANNEL_REPLAYANALYSIS,
  process.env.BOT_MEETING_CHANNEL,
];
const sc = [
  process.env.BOT_SCHEDULE_CHANNEL_BOTBASH,
  process.env.BOT_SCHEDULE_CHANNEL_TRYOUT,
  process.env.BOT_SCHEDULE_CHANNEL_5V5,
  process.env.BOT_SCHEDULE_CHANNEL_5V5_T3,
];
const cs =
  "<#" +
  process.env.BOT_LOBBY_CHANNEL_EU +
  ">, <#" +
  process.env.BOT_LOBBY_CHANNEL_NA +
  ">, <#" +
  process.env.BOT_LOBBY_CHANNEL_SEA +
  ">, <#" +
  process.env.BOT_LOBBY_CHANNEL_TRYOUT +
  ">, <#" +
  process.env.BOT_LOBBY_CHANNEL_TEST +
  ">, <#" +
  process.env.BOT_LOBBY_CHANNEL_REPLAYANALYSIS +
  ">, <#" +
  process.env.BOT_LOBBY_CHANNEL_BOTBASH +
  ">";

// channel management
module.exports = {
  scheduleChannelBotbash: process.env.BOT_SCHEDULE_CHANNEL_BOTBASH,
  scheduleChannelTryout: process.env.BOT_SCHEDULE_CHANNEL_TRYOUT,
  scheduleChannel5v5: process.env.BOT_SCHEDULE_CHANNEL_5V5,
  scheduleChannel5v5_t3: process.env.BOT_SCHEDULE_CHANNEL_5V5_T3,
  signupChannel: process.env.BOT_SIGNUP_CHANNEL,
  scheduleChannels: sc,
  lobbyChannels: lc,
  channelStrings: cs,
  isWatchingChannel: function (channelId: string) {
    return lc.includes(channelId) || sc.includes(channelId);
  },
};
