import { getSortedReferrers } from "./database";
import { DFZDiscordClient } from "./types/DFZDiscordClient";
import { GuildChannel, Message } from "discord.js";
import { generateEmbedding } from "./answerEmbedding";
import { tableBaseReferrersTemplate, addDBReferrerRowToTable } from "./highScoreTables";

export const guildId: string =
  process.env.GUILD !== undefined ? process.env.GUILD : "";
  
const getChannel = async (client: DFZDiscordClient, channelId: string | undefined) => {
  if (!client)
    return undefined;

  var guild = await client.guilds.fetch(guildId);
  var channel: GuildChannel | undefined = guild.channels.cache.find((chan: GuildChannel) => {
    return chan.id == channelId;
  });

  if (!channel || !channel.isText())
    return undefined;

  return channel;
};
export const postReferralLeaderboard = async (client: DFZDiscordClient) => {
  console.log("In postReferralLeaderboard");
  var channel = await getChannel(client, process.env.BOT_LEADERBOARD_CHANNEL);
  if (channel === undefined)
    return;

  var message: Message | undefined = undefined;
  if (_messageId) {
    try {
      message = await channel.messages.fetch(_messageId);
    } catch (e) {
      console.log(e);
    }
  }

  var referrers = await getSortedReferrers(client.dbHandle);
  if (referrers.length > 0) {

    var tableBase = JSON.parse(JSON.stringify(tableBaseReferrersTemplate));
    const maxNum = 50;
    for (let i = 0; i < Math.min(maxNum, referrers.length); i++) {
      addDBReferrerRowToTable(tableBase, referrers[i]);
    }

    var _embed = generateEmbedding(
      "Referrer High score",
      "Hall of Fame of DFZ referrerrs!",
      "",
      tableBase
    );
    if (!message) {
      console.log("In postReferralLeaderboard sending message");
      const msg = await channel.send({ embed: _embed });
      _messageId = msg.id;
    } else {
      // update embed
      console.log("In postReferralLeaderboard editing message");
      await message.edit(_embed);
    }

  }
};
export const findClientMessage = async (client: DFZDiscordClient) => {
  var channel = await getChannel(client, process.env.BOT_LEADERBOARD_CHANNEL);
  if (channel === undefined)
    return;

  var message: Message | undefined = undefined;
  try {
    const messages = await channel.messages.fetch();
    message = messages.find(msg => {
      return msg.author === client.user;
    });
  } catch (e) {
    console.log(e);
  }

  if (message)
    _messageId = message.id;
};
var _messageId: string | undefined = undefined;
