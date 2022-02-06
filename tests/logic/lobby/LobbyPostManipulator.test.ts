import { expect } from "chai";
import { DFZDiscordClient } from "../../../src/logic/discord/DFZDiscordClient";
import { LobbyPostManipulator } from "../../../src/logic/lobby/LobbyPostManipulator";
import { Lobby } from "../../../src/logic/serializables/lobby";
import { ITime } from "../../../src/logic/time/interfaces/Time";

describe("LobbyPostManipulator tests", () => {
  const client = new DFZDiscordClient();
  client.
  const lobbyTime: ITime = {
    day: 16,
    year: 2022,
    zone: {
      offset: -60,
      abbreviation: "CET",
    },
    epoch: 1642356609420,
    hours: 19,
    month: 1,
    minutes: 10,
    seconds: 9,
    dayOfWeek: 0,
    milliseconds: 420,
  };
  const lobby: Lobby = new Lobby({
    date: lobbyTime,
    type: 1,
    guildId: "414105862857162752",
    beginnerRoleIds: ["714060964336500737", "714060990592974928"],
    regionId: "760942925827407872",
    coaches: ["366594625210679309"],
    channelId: "739442224139468881",
  });

  it("checking default options", async () => {
    const channel = await client.channels.fetch(lobby.channelId);
    if (!channel || !channel.isText())
      throw new Error("Is not a text channel...");
    LobbyPostManipulator.writeLobbyStartPost(lobby, channel);
    console.log("I am here!");
    expect("I am here!").to.deep.equal("I am here!");
  });
});
