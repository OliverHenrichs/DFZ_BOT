export const lobbyChannels = [
  process.env.BOT_LOBBY_CHANNEL_EU ? process.env.BOT_LOBBY_CHANNEL_EU : "",
  process.env.BOT_LOBBY_CHANNEL_NA ? process.env.BOT_LOBBY_CHANNEL_NA : "",
  process.env.BOT_LOBBY_CHANNEL_SEA ? process.env.BOT_LOBBY_CHANNEL_SEA : "",
  process.env.BOT_LOBBY_CHANNEL_TRYOUT ? process.env.BOT_LOBBY_CHANNEL_TRYOUT : "",
  process.env.BOT_LOBBY_CHANNEL_TEST ? process.env.BOT_LOBBY_CHANNEL_TEST : "",
  process.env.BOT_LOBBY_CHANNEL_BOTBASH ? process.env.BOT_LOBBY_CHANNEL_BOTBASH : "",
  process.env.BOT_LOBBY_CHANNEL_REPLAYANALYSIS ? process.env.BOT_LOBBY_CHANNEL_REPLAYANALYSIS : "",
  process.env.BOT_MEETING_CHANNEL ? process.env.BOT_MEETING_CHANNEL : "",
];
export const scheduleChannels = [
  process.env.BOT_SCHEDULE_CHANNEL_BOTBASH ? process.env.BOT_SCHEDULE_CHANNEL_BOTBASH : "",
  process.env.BOT_SCHEDULE_CHANNEL_TRYOUT ? process.env.BOT_SCHEDULE_CHANNEL_TRYOUT : "",
  process.env.BOT_SCHEDULE_CHANNEL_5V5 ? process.env.BOT_SCHEDULE_CHANNEL_5V5 : "",
  process.env.BOT_SCHEDULE_CHANNEL_5V5_T3 ? process.env.BOT_SCHEDULE_CHANNEL_5V5_T3 : "",
];
export const channelStrings =
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

export const scheduleChannelBotbash = process.env.BOT_SCHEDULE_CHANNEL_BOTBASH ? process.env.BOT_SCHEDULE_CHANNEL_BOTBASH : "";
export const scheduleChannelTryout = process.env.BOT_SCHEDULE_CHANNEL_TRYOUT ? process.env.BOT_SCHEDULE_CHANNEL_TRYOUT : "";
export const scheduleChannel5v5 = process.env.BOT_SCHEDULE_CHANNEL_5V5 ? process.env.BOT_SCHEDULE_CHANNEL_5V5 : "";
export const scheduleChannel5v5_t3 = process.env.BOT_SCHEDULE_CHANNEL_5V5_T3 ? process.env.BOT_SCHEDULE_CHANNEL_5V5_T3 : "";
export const signupChannel = process.env.BOT_SIGNUP_CHANNEL ? process.env.BOT_SIGNUP_CHANNEL : "";
export function isWatchingChannel(channelId: string) {
  return lobbyChannels.includes(channelId) || scheduleChannels.includes(channelId);
};
