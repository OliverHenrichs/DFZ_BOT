import {
  GuildChannel,
  GuildChannelManager,
  NewsChannel,
  TextChannel,
} from "discord.js";
import { guildId } from "./constants";
import { DFZDiscordClient } from "./types/DFZDiscordClient";
import { Lobby } from "./types/lobby";

export const lobbyChannels = [
  process.env.BOT_LOBBY_CHANNEL_EU ? process.env.BOT_LOBBY_CHANNEL_EU : "",
  process.env.BOT_LOBBY_CHANNEL_NA ? process.env.BOT_LOBBY_CHANNEL_NA : "",
  process.env.BOT_LOBBY_CHANNEL_SEA ? process.env.BOT_LOBBY_CHANNEL_SEA : "",
  process.env.BOT_LOBBY_CHANNEL_TRYOUT
    ? process.env.BOT_LOBBY_CHANNEL_TRYOUT
    : "",
  process.env.BOT_LOBBY_CHANNEL_TEST ? process.env.BOT_LOBBY_CHANNEL_TEST : "",
  process.env.BOT_LOBBY_CHANNEL_BOTBASH
    ? process.env.BOT_LOBBY_CHANNEL_BOTBASH
    : "",
  process.env.BOT_LOBBY_CHANNEL_REPLAYANALYSIS
    ? process.env.BOT_LOBBY_CHANNEL_REPLAYANALYSIS
    : "",
  process.env.BOT_LOBBY_CHANNEL_T3 ? process.env.BOT_LOBBY_CHANNEL_T3 : "",
  process.env.BOT_MEETING_CHANNEL ? process.env.BOT_MEETING_CHANNEL : "",
];
export const scheduleChannels = [
  process.env.BOT_SCHEDULE_CHANNEL_BOTBASH
    ? process.env.BOT_SCHEDULE_CHANNEL_BOTBASH
    : "",
  process.env.BOT_SCHEDULE_CHANNEL_TRYOUT
    ? process.env.BOT_SCHEDULE_CHANNEL_TRYOUT
    : "",
  process.env.BOT_SCHEDULE_CHANNEL_5V5
    ? process.env.BOT_SCHEDULE_CHANNEL_5V5
    : "",
  process.env.BOT_SCHEDULE_CHANNEL_5V5_T3
    ? process.env.BOT_SCHEDULE_CHANNEL_5V5_T3
    : "",
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
  process.env.BOT_LOBBY_CHANNEL_T3 +
  ">, <#" +
  process.env.BOT_LOBBY_CHANNEL_BOTBASH +
  ">";

export const scheduleChannelBotbash = process.env.BOT_SCHEDULE_CHANNEL_BOTBASH
  ? process.env.BOT_SCHEDULE_CHANNEL_BOTBASH
  : "";
export const scheduleChannelTryout = process.env.BOT_SCHEDULE_CHANNEL_TRYOUT
  ? process.env.BOT_SCHEDULE_CHANNEL_TRYOUT
  : "";
export const scheduleChannel5v5 = process.env.BOT_SCHEDULE_CHANNEL_5V5
  ? process.env.BOT_SCHEDULE_CHANNEL_5V5
  : "";
export const scheduleChannel5v5_t3 = process.env.BOT_SCHEDULE_CHANNEL_5V5_T3
  ? process.env.BOT_SCHEDULE_CHANNEL_5V5_T3
  : "";
export const signupChannel = process.env.BOT_SIGNUP_CHANNEL
  ? process.env.BOT_SIGNUP_CHANNEL
  : "";
export function isWatchingChannel(channelId: string) {
  return (
    lobbyChannels.includes(channelId) || scheduleChannels.includes(channelId)
  );
}

export async function getChannel(
  client: DFZDiscordClient,
  channelId: string | undefined
) {
  return new Promise<NewsChannel | TextChannel | undefined>(async function (
    resolve,
    reject
  ) {
    try {
      if (!client) {
        resolve(undefined);
        return;
      }

      var guild = await client.guilds.fetch(guildId);
      var channel: GuildChannel | undefined = guild.channels.cache.find(
        (chan: GuildChannel) => {
          return chan.id == channelId;
        }
      );

      if (!channel || !channel.isText()) {
        resolve(undefined);
        return;
      }
      resolve(channel);
    } catch (e) {
      reject("Failed retrieving GuildChannel");
    }
  });
}

export function getLobbyChannelFromGuildManager(
  lobby: Lobby,
  channels: GuildChannelManager
): TextChannel | NewsChannel | undefined {
  var channel: GuildChannel | undefined = channels.cache.find((chan) => {
    return chan.id == lobby.channelId;
  });
  if (!channel || !channel.isText()) return undefined;

  return channel;
}
