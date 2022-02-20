import {
  Guild,
  Message,
  MessageEmbed,
  NewsChannel,
  TextChannel,
} from "discord.js";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { ChannelManager } from "../discord/DFZChannelManager";
import { DFZDiscordClient } from "../discord/DFZDiscordClient";
import { Lobby } from "../serializables/Lobby";
import { LobbySerializer } from "../serializers/LobbySerializer";
import { SerializeUtils } from "../serializers/SerializeUtils";
import { ILobbyFetchResult } from "./interfaces/ILobbyFetchResult";
import { LobbyPostManipulator } from "./LobbyPostManipulator";

export class LobbyTimeController {
  /**
   *  Update each lobby post and prune deleted and deprecated lobbies
   */
  public static async checkAndUpdateLobbies(
    client: DFZDiscordClient,
    guild: Guild
  ) {
    const gdbc = SerializeUtils.fromGuildtoGuildDBClient(
      guild,
      client.dbClient
    );
    const serializer = new LobbySerializer(gdbc);

    const lobbies: Lobby[] = await serializer.get();
    for (const lobby of lobbies) {
      await LobbyTimeController.tryCheckAndUpdateLobby(
        lobby,
        client,
        serializer
      );
    }
  }

  private static async tryCheckAndUpdateLobby(
    lobby: Lobby,
    client: DFZDiscordClient,
    serializer: LobbySerializer
  ) {
    try {
      await this.checkAndUpdateLobby(lobby, client, serializer);
    } catch (error) {
      console.log(
        `Could not update lobby post of lobby ${JSON.stringify(lobby)}`
      );
    }
  }

  private static async checkAndUpdateLobby(
    lobby: Lobby,
    client: DFZDiscordClient,
    serializer: LobbySerializer
  ) {
    const channel = await ChannelManager.getChannel(client, lobby.channelId);
    await this.tryPruneAndUpdateTimeOnLobbyPost(
      lobby,
      channel,
      client.dbClient,
      serializer
    );
  }

  private static async tryPruneAndUpdateTimeOnLobbyPost(
    lobby: Lobby,
    channel: TextChannel | NewsChannel,
    dbClient: DFZDataBaseClient,
    serializer: LobbySerializer
  ) {
    const lobbyFetchResult = await this.fetchLobbyFromDiscord(lobby, channel);
    if (!lobbyFetchResult) {
      // remove if e.g. an admin deleted the message
      return serializer.delete([lobby]);
    }

    const remainingTime = lobby.calculateRemainingTime();
    if (remainingTime.totalMs < 0 && remainingTime.hours >= 3) {
      return await this.cancelDeprecatedLobby(lobby, channel, dbClient);
    }

    if (lobby.started) return;

    await LobbyPostManipulator.updateLobbyPostDescription(
      lobbyFetchResult,
      remainingTime
    );
  }

  private static async fetchLobbyFromDiscord(
    lobby: Lobby,
    channel: TextChannel | NewsChannel
  ): Promise<ILobbyFetchResult | undefined> {
    const message = await this.getMessageFromChannel(channel, lobby.messageId);
    if (message === undefined) {
      return undefined;
    }

    const old_embed: MessageEmbed = message.embeds[0];
    if (old_embed === undefined) {
      return undefined;
    }

    return { message: message, embed: old_embed };
  }

  private static async cancelDeprecatedLobby(
    lobby: Lobby,
    channel: TextChannel | NewsChannel,
    dbClient: DFZDataBaseClient
  ) {
    await LobbyPostManipulator.cancelLobbyPost(
      lobby,
      channel,
      "Lobby is deprecated. Did the coach not show up? Pitchforks out! 😾"
    );
    const gdbc = SerializeUtils.getGuildDBClient(lobby.guildId, dbClient);
    const serializer = new LobbySerializer(gdbc);
    await serializer.delete([lobby]);
  }

  private static async getMessageFromChannel(
    channel: TextChannel | NewsChannel,
    messageId: string
  ): Promise<Message | undefined> {
    try {
      return channel.messages.fetch(messageId);
    } catch (e) {
      return undefined;
    }
  }
}
