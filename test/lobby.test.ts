import { suite, test } from "@testdeck/mocha";
import { expect, assert, should } from "chai";
import { Message, Role } from "discord.js";
import postLobby, {
  tryGetLobbyOptionsFromMessage,
} from "../src/commands/postLobby";
import { ChannelManager } from "../src/logic/discord/ChannelManager";
import { DFZDiscordClient } from "../src/logic/discord/DFZDiscordClient";
import { LobbyPostManipulator } from "../src/logic/lobby/LobbyPostManipulator";
import { Lobby } from "../src/logic/serializables/lobby";
import { LobbySerializer } from "../src/logic/serializers/lobbySerializer";
import {
  beginnerRoles,
  getNumberFromBeginnerRole,
} from "../src/misc/roleManagement";
import { addUser } from "../src/misc/userHelper";
import * as dotenv from "dotenv";
import { doesNotMatch } from "node:assert";
dotenv.config();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const testChannel = ChannelManager.lobbyChannels[4];

class LobbyTester {
  private client = new DFZDiscordClient();

  async lobbyCreation(): Promise<boolean> {
    try {
      const loginResponse = await this.client.login(process.env.BOT_TOKEN);
      console.log(`loginResponse: ${loginResponse}`);
      await delay(3000);
      const channel = await ChannelManager.getChannel(this.client, testChannel);
      const message = {
        content: "!post inhouse EU 1,2,3 10:00pm CET",
        channel: channel,
      };

      const options = tryGetLobbyOptionsFromMessage(
        message as unknown as Message
      );
      await LobbyPostManipulator.postLobby(
        this.client.dbClient,
        message.channel,
        options
      );
      return true;
    } catch {
      return false;
    }
  }

  private fillWithUsers(lobby: Lobby) {
    for (let i = 0; i < 14; i++) {
      const curBeginnerRole = beginnerRoles[i % 2 === 0 ? 1 : 2];

      const role = {
        id: curBeginnerRole,
        number: getNumberFromBeginnerRole(curBeginnerRole),
        name: "TestRole",
      };

      addUser(
        lobby,
        `testuser${i}`,
        `user_${i}`,
        [1, 2, 3, 4, 5],
        role as unknown as Role,
        undefined
      );
    }
  }

  async fillLobbyAndPost(): Promise<boolean> {
    try {
      console.log("fillLobbyAndPost");
      const serializer = new LobbySerializer(this.client.dbClient, testChannel);
      console.log("fillLobbyAndPost /w serializer");
      const lobbies = await serializer.get();
      console.log("gotten lobbies : " + lobbies.length);
      const lobby = lobbies[0];
      this.fillWithUsers(lobby);
      serializer.update(lobby);

      const channel = await ChannelManager.getChannel(this.client, testChannel);
      console.log(`channel in fillLobbyAndPost: ${channel.id}`);

      await LobbyPostManipulator.tryUpdateLobbyPost(lobby, channel);
      return true;
    } catch (error) {
      console.log(JSON.stringify(error));

      return false;
    }
  }

  public shutdown(): void {
    this.client.shutdown();
  }
}

const tester = new LobbyTester();

should();
describe("Lobby post testing", () => {
  it("creates a lobby, fills it with players, and posts the whole shit", async function (done) {
    let res = await tester.lobbyCreation();
    res = res && (await tester.fillLobbyAndPost());
    console.log(`after fillLobbyAndPost: ${res}`);
    res.should.be.true;
    tester.shutdown();
    done();
  });
});
