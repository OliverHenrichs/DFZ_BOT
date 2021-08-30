import { GuildChannel, NewsChannel, TextChannel } from "discord.js";
import { guildId } from "../../misc/constants";
import { DFZDiscordClient } from "./DFZDiscordClient";
import { EnvironmentVariableManager as EVM } from "../misc/EnvironmentVariableManager";

export class ChannelManager {
  public static async getChannel(
    client: DFZDiscordClient,
    channelId: string
  ): Promise<TextChannel | NewsChannel> {
    const guild = await client.guilds.fetch(guildId);
    const channel: GuildChannel | undefined = guild.channels.cache.find(
      (chan: GuildChannel) => {
        return chan.id == channelId;
      }
    );

    if (channel === undefined || !channel.isText()) {
      console.log("ehm, channel undefined...");

      throw new Error(
        `Did not find text channel ${channelId} for guild ${guildId}`
      );
    }

    return channel;
  }

  public static isWatchingChannel(channelId: string) {
    return (
      ChannelManager.lobbyChannels.includes(channelId) ||
      ChannelManager.scheduleChannels.includes(channelId)
    );
  }

  public static lobbyChannels = [
    EVM.ensureString(process.env.BOT_LOBBY_CHANNEL_EU),
    EVM.ensureString(process.env.BOT_LOBBY_CHANNEL_NA),
    EVM.ensureString(process.env.BOT_LOBBY_CHANNEL_SEA),
    EVM.ensureString(process.env.BOT_LOBBY_CHANNEL_TRYOUT),
    EVM.ensureString(process.env.BOT_LOBBY_CHANNEL_TEST),
    EVM.ensureString(process.env.BOT_LOBBY_CHANNEL_BOTBASH),
    EVM.ensureString(process.env.BOT_LOBBY_CHANNEL_REPLAYANALYSIS),
    EVM.ensureString(process.env.BOT_LOBBY_CHANNEL_T3),
    EVM.ensureString(process.env.BOT_MEETING_CHANNEL),
  ];

  public static scheduleChannels = [
    EVM.ensureString(process.env.BOT_SCHEDULE_CHANNEL_BOTBASH),
    EVM.ensureString(process.env.BOT_SCHEDULE_CHANNEL_TRYOUT),
    EVM.ensureString(process.env.BOT_SCHEDULE_CHANNEL_5V5),
    EVM.ensureString(process.env.BOT_SCHEDULE_CHANNEL_5V5_T3),
  ];

  public static channelStrings = `<#${ChannelManager.lobbyChannels.join(
    ">, <#"
  )}>`;

  public static scheduleChannelBotbash = EVM.ensureString(
    process.env.BOT_SCHEDULE_CHANNEL_BOTBASH
  );
  public static scheduleChannelTryout = EVM.ensureString(
    process.env.BOT_SCHEDULE_CHANNEL_TRYOUT
  );
  public static scheduleChannel5v5 = EVM.ensureString(
    process.env.BOT_SCHEDULE_CHANNEL_5V5
  );
  public static scheduleChannel5v5_t3 = EVM.ensureString(
    process.env.BOT_SCHEDULE_CHANNEL_5V5_T3
  );
  public static signupChannel = EVM.ensureString(
    process.env.BOT_SIGNUP_CHANNEL
  );
}
