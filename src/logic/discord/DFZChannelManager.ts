import { channelMention } from "@discordjs/builders";
import { NewsChannel, TextChannel } from "discord.js";
import { dfzGuildId } from "../../misc/constants";
import { EnvironmentVariableManager as EVM } from "../misc/EnvironmentVariableManager";
import { DFZDiscordClient } from "./DFZDiscordClient";

export class ChannelManager {
  public static async getChannel(
    client: DFZDiscordClient,
    channelId: string,
    guildId: string = dfzGuildId
  ): Promise<TextChannel | NewsChannel> {
    const guild = await client.guilds.fetch(guildId);
    const channel = await client.findChannel(guild, channelId);

    if (!channel || !channel.isText()) {
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

  public static tryoutChannel = EVM.ensureString(
    process.env.BOT_LOBBY_CHANNEL_TRYOUT
  );
  public static replayAnalysisChannel = EVM.ensureString(
    process.env.BOT_LOBBY_CHANNEL_REPLAYANALYSIS
  );

  public static scheduleChannels = [
    EVM.ensureString(process.env.BOT_SCHEDULE_CHANNEL_BOTBASH),
    EVM.ensureString(process.env.BOT_SCHEDULE_CHANNEL_TRYOUT),
    EVM.ensureString(process.env.BOT_SCHEDULE_CHANNEL_5V5),
    EVM.ensureString(process.env.BOT_SCHEDULE_CHANNEL_5V5_T3),
  ];

  public static channelStringList = ChannelManager.lobbyChannels.map(
    (channel) => channelMention(channel)
  );

  public static combinedChannelStrings =
    ChannelManager.channelStringList.join(", ");

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
