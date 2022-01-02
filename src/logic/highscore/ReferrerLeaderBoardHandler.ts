import {
  Collection,
  Message,
  MessageEmbed,
  NewsChannel,
  TextChannel,
} from "discord.js";
import { dfzGuildId } from "../../misc/constants";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { ChannelManager } from "../discord/DFZChannelManager";
import { DFZDiscordClient } from "../discord/DFZDiscordClient";
import { EmbeddingCreator } from "../discord/EmbeddingCreator";
import { IFieldElement } from "../discord/interfaces/IFieldElement";
import { EnvironmentVariableManager as EVM } from "../misc/EnvironmentVariableManager";
import { ReferrerSerializer } from "../serializers/ReferrerSerializer";
import { SerializeUtils } from "../serializers/SerializeUtils";
import { HighscoreUserTypes } from "./enums/HighscoreUserTypes";
import providerFactory from "./factories/HighscoreProviderFactory";
import { ReferrerHighscoreProvider } from "./ReferrerHighscoreProvider";

export class ReferrerLeaderBoardHandler {
  public static async postReferralLeaderboard(client: DFZDiscordClient) {
    try {
      await ReferrerLeaderBoardHandler.tryPostLeaderBoard(client);
    } catch (e) {
      console.log(e);
    }
  }

  private static async tryPostLeaderBoard(client: DFZDiscordClient) {
    const embed =
      await ReferrerLeaderBoardHandler.getReferrerLeaderBoardEmbedding(
        client.dbClient
      );
    const channel = await ChannelManager.getChannel(
      client,
      EVM.ensureString(process.env.BOT_LEADERBOARD_CHANNEL)
    );
    await ReferrerLeaderBoardHandler.postUpdatedEmbedding(channel, embed);
  }

  private static async getReferrerLeaderBoardEmbedding(
    dbClient: DFZDataBaseClient
  ) {
    const highscoreTable = await ReferrerLeaderBoardHandler.getHighscoreTable(
      dbClient
    );

    return EmbeddingCreator.create(
      "Referrer High score",
      "Hall of Fame of DFZ referrerrs!",
      "",
      highscoreTable
    );
  }

  private static async getHighscoreTable(
    dbClient: DFZDataBaseClient
  ): Promise<IFieldElement[]> {
    const gdbc = SerializeUtils.getGuildDBClient(dfzGuildId, dbClient);
    const serializer = new ReferrerSerializer(gdbc);
    const referrers = await serializer.getSorted();
    if (referrers.length === 0) return [];

    const highscoreProvider = providerFactory(
      HighscoreUserTypes.referrers,
      dbClient
    ) as ReferrerHighscoreProvider;
    return highscoreProvider.generateHighscore(referrers);
  }

  private static async postUpdatedEmbedding(
    channel: TextChannel | NewsChannel,
    embed: MessageEmbed
  ) {
    const message = await channel.messages.fetch(messageId);
    const messageOptions = { embeds: [embed] };
    if (!message) {
      const msg = await channel.send(messageOptions);
      messageId = msg.id;
    } else {
      await message.edit(messageOptions);
    }
  }

  public static async findLeaderBoardMessage(client: DFZDiscordClient) {
    try {
      await ReferrerLeaderBoardHandler.tryFindLeaderBoardMessage(client);
    } catch (e) {
      console.log(e);
    }
  }

  private static async tryFindLeaderBoardMessage(client: DFZDiscordClient) {
    const channel = await ChannelManager.getChannel(
      client,
      EVM.ensureString(process.env.BOT_LEADERBOARD_CHANNEL)
    );
    const messages = await channel.messages.fetch();
    ReferrerLeaderBoardHandler.findAndUpdateLeaderBoardMessage(
      messages,
      client
    );
  }

  private static findAndUpdateLeaderBoardMessage(
    messages: Collection<string, Message>,
    client: DFZDiscordClient
  ) {
    const message: Message | undefined = messages.find((msg) => {
      return msg.author === client.user;
    });

    if (message) messageId = message.id;
  }
}

var messageId: string = "";
