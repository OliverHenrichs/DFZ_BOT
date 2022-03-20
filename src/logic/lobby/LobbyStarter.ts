import { TextBasedChannels, User } from "discord.js";
import {
  getLobbyNameByType,
  getPlayersPerLobbyByLobbyType,
} from "../../misc/constants";
import { saveCoachParticipation } from "../../misc/tracker";
import { DFZDiscordClient } from "../discord/DFZDiscordClient";
import { Lobby } from "../serializables/Lobby";
import { LobbySerializer } from "../serializers/LobbySerializer";
import { SerializeUtils } from "../serializers/SerializeUtils";
import { TimeInMs } from "../time/TimeConverter";
import { LobbyPostManipulator } from "./LobbyPostManipulator";

export class LobbyStarter {
  client: DFZDiscordClient;
  lobby: Lobby;

  constructor(client: DFZDiscordClient, lobby: Lobby) {
    this.client = client;
    this.lobby = lobby;
  }

  public async tryStartLobby(
    coach: User,
    channel: TextBasedChannels
  ): Promise<boolean> {
    try {
      return await this.startLobby(coach, channel);
    } catch (error) {
      await coach.send(
        `Encountered an error when starting the lobby: ${error}`
      );
      return false;
    }
  }

  private async startLobby(
    coach: User,
    channel: TextBasedChannels
  ): Promise<boolean> {
    if (!(await LobbyStarter.testLobbyStartTime(this.lobby, coach))) {
      return false;
    }

    if (!this.playersShowedUp()) {
      await this.handleNoPlayers(coach, channel);
      return true;
    }

    LobbyPostManipulator.writeLobbyStartPost(this.lobby, channel);

    await this.notifyPlayers();
    await LobbyStarter.notifyCoach(coach);

    await LobbyPostManipulator.tryUpdateLobbyPostTitle(
      this.lobby.messageId,
      channel,
      "[⛔ Lobby started already! 😎]"
    );

    await saveCoachParticipation(
      this.client.dbClient,
      this.lobby.guildId,
      this.lobby.coaches,
      this.lobby.type
    );

    await this.updateDatabase();

    return true;
  }

  private async updateDatabase() {
    this.lobby.started = true;

    const gdbc = SerializeUtils.getGuildDBClient(
      this.lobby.guildId,
      this.client.dbClient
    );
    const serializer = new LobbySerializer(gdbc);
    await serializer.update(this.lobby);
  }

  private static async testLobbyStartTime(
    lobby: Lobby,
    coach: User
  ): Promise<boolean> {
    const timeLeftInMS = lobby.date.epoch - +new Date();
    if (timeLeftInMS > TimeInMs.fiveMinutes) {
      await LobbyStarter.handleEarlyStartAttempt(
        coach,
        LobbyStarter.getRemainingTimeInMinutes(
          timeLeftInMS - TimeInMs.fiveMinutes
        )
      );
      return false;
    }

    return true;
  }

  private static getRemainingTimeInMinutes(milliseconds: number) {
    return Math.floor(milliseconds / TimeInMs.oneMinute);
  }

  private static async handleEarlyStartAttempt(coach: User, timeLeft: number) {
    await coach.send(
      "It's not time to start the lobby yet (" + timeLeft + " min to go)."
    );
  }

  private async handleNoPlayers(coach: User, channel: TextBasedChannels) {
    await LobbyPostManipulator.cancelLobbyPost(
      this.lobby,
      channel,
      "Nobody showed up!"
    );
    await coach.send(
      "🔒 I started the lobby. Nobody signed up tho, so just play some Dotes instead 😎"
    );
  }

  private static async notifyCoach(coach: User): Promise<void> {
    await coach.send("🔒 I started the lobby.");
  }

  private async notifyPlayers() {
    const message = this.getPlayerNotificationMessage();
    const playerCount = getPlayersPerLobbyByLobbyType(this.lobby.type);
    for (let i = 0; i < Math.min(this.lobby.users.length, playerCount); i++) {
      await this.notifyUser(this.lobby.users[i].id, message);
    }
  }

  private async notifyUser(userId: string, message: string) {
    try {
      const user = await this.client.users.fetch(userId);
      if (user !== undefined) await user.send(message);
    } catch (e) {
      console.log("Error notifying players. Errormessage: " + e);
    }
  }

  private getPlayerNotificationMessage() {
    return `Your ${getLobbyNameByType(
      this.lobby.type
    )}-lobby just started! 😎 Please move to the voice channel and await further instructions.`;
  }

  private playersShowedUp(): boolean {
    return this.lobby.users.length > 0;
  }
}
