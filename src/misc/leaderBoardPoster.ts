import { getSortedReferrers } from "./database";
import { DFZDiscordClient } from "./types/DFZDiscordClient";
import { Message } from "discord.js";
import { generateEmbedding } from "./answerEmbedding";
import {
  tableBaseReferrersTemplate,
  addDBReferrerRowToTable,
} from "./highScoreTables";
import { getChannel } from "./channelManagement";
import { Referrer } from "./types/referrer";

function getReferrerTable(referrers: Referrer[]) {
  var tableBase = JSON.parse(JSON.stringify(tableBaseReferrersTemplate));
  const maxNum = 50;
  for (let i = 0; i < Math.min(maxNum, referrers.length); i++) {
    addDBReferrerRowToTable(tableBase, referrers[i]);
  }

  return tableBase;
}

export const postReferralLeaderboard = async (client: DFZDiscordClient) => {
  try {
    var channel = await getChannel(client, process.env.BOT_LEADERBOARD_CHANNEL);
    if (channel === undefined) return;

    var message: Message | undefined = undefined;
    if (_messageId) {
      message = await channel.messages.fetch(_messageId);
    }

    var referrers = await getSortedReferrers(client.dbHandle);
    if (referrers.length === 0) return;

    const table = getReferrerTable(referrers);

    var _embed = generateEmbedding(
      "Referrer High score",
      "Hall of Fame of DFZ referrerrs!",
      "",
      table
    );

    if (!message) {
      const msg = await channel.send({ embed: _embed });
      _messageId = msg.id;
    } else {
      // update embed
      await message.edit(_embed);
    }
  } catch (e) {
    console.log(e);
  }
};

export const findLeaderBoardMessage = async (client: DFZDiscordClient) => {
  try {
    var channel = await getChannel(client, process.env.BOT_LEADERBOARD_CHANNEL);
    if (channel === undefined) return;
    const messages = await channel.messages.fetch();
    var message: Message | undefined = messages.find((msg) => {
      return msg.author === client.user;
    });

    if (message) _messageId = message.id;
  } catch (e) {
    console.log(e);
  }
};
var _messageId: string | undefined = undefined;
