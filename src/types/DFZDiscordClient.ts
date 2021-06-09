import { Client, ClientOptions } from "discord.js";
import { readdirSync } from "fs";
import { lobbyChannels } from "../misc/channelManagement";
import { guildId } from "../misc/constants";
import { LobbyTimeout } from "../misc/interfaces/LobbyTimeout";
import {
  postReferralLeaderboard,
  findLeaderBoardMessage,
} from "../misc/leaderBoardPoster";
import { updateLobbyPosts } from "../misc/lobbyManagement";
import {
  updateSchedules,
  insertScheduledLobbies,
} from "../misc/scheduleManagement";
import { DFZDataBaseClient } from "./database/DFZDataBaseClient";
import { Schedule } from "./serializables/schedule";
import { LobbySerializer } from "./serializers/lobbySerializer";
import { ScheduleSerializer } from "./serializers/scheduleSerializer";

export class DFZDiscordClient extends Client {
  dbClient: DFZDataBaseClient;
  timeouts: LobbyTimeout[] = [];
  constructor(options?: ClientOptions | undefined) {
    super(options);

    this.setupDiscordEventHandlers();
    this.dbClient = new DFZDataBaseClient();
    console.log("end constructor");
  }

  private setupDiscordEventHandlers() {
    console.log("in setupDiscordEventHandlers");

    const files = readdirSync("./build/src/events/");
    console.log("Files: " + files.toString());

    for (const file of files) {
      //if (file.endsWith("ts")) return;
      console.log("1 ");
      const eventHandler = require(`../events/${file}`);
      console.log("2 ");
      const eventName = file.split(".")[0];
      this.on(eventName, (...args: any) => eventHandler(this, ...args));
      console.log("caught event " + eventName);
    }
  }

  async onReady() {
    try {
      console.log("start onReady");

      await this.setupBot();
      console.log("finish onReady");
    } catch (error) {
      console.log(`Error while setting up bot:\
      ${error}`);
    }
  }

  private async setupBot() {
    await this.dbClient.tryCreateDataBaseTables();

    await this.fetchDiscordData();
    await this.setIntervalTasks();
  }

  private async fetchDiscordData() {
    await this.fetchLobbyMessages();
    await this.fetchScheduleMessages();
  }

  private async setIntervalTasks() {
    await this.setLobbyPostUpdateTimer();
    await this.setSchedulePostUpdateTimer();
    await this.setPostLobbyFromScheduleTimer();
    await this.setLeaderBoardPostTimer();
  }

  private async fetchLobbyMessages() {
    var guild = await this.guilds.fetch(guildId);
    for (const channel of lobbyChannels) {
      var gc = guild.channels.cache.find((chan) => chan.id === channel);
      if (gc === undefined || !gc.isText()) {
        continue;
      }

      const serializer = new LobbySerializer(this.dbClient, channel);
      var lobbies = await serializer.get();
      if (lobbies.length === 0 || lobbies === [] || lobbies === undefined)
        continue;

      for (const lobby of lobbies) {
        await gc.messages.fetch(lobby.messageId);
      }
    }
  }

  private async fetchScheduleMessages() {
    const serializer = new ScheduleSerializer(this.dbClient);
    const schedules = await serializer.get();
    if (schedules === undefined || schedules.length === 0) return;

    var fetchedSchedulePosts = this.getUniqueSchedulePosts(schedules);

    var guild = await this.guilds.fetch(guildId);
    for (const post of fetchedSchedulePosts) {
      var gc = guild.channels.cache.find((chan) => chan.id === post.channelId);

      if (gc === undefined || !gc.isText()) {
        continue;
      }
      gc.messages.fetch(post.messageId);
    }
  }

  private getUniqueSchedulePosts(schedules: Array<Schedule>) {
    var fetchedSchedulePosts = [];

    for (const schedule of schedules) {
      const containsPost: boolean =
        fetchedSchedulePosts.find(
          (fetched) =>
            fetched.messageId == schedule.messageId &&
            fetched.channelId === schedule.channelId
        ) !== undefined;
      if (containsPost) continue;

      fetchedSchedulePosts.push({
        messageId: schedule.messageId,
        channelId: schedule.channelId,
      });
    }
    return fetchedSchedulePosts;
  }

  private async setLobbyPostUpdateTimer() {
    const timeUpdater = async () => {
      try {
        var guild = await this.guilds.fetch(guildId);
        if (guild === undefined || guild === null) return;
        await updateLobbyPosts(guild, this.dbClient);
      } catch {
        (err: string) => console.log(err);
      }
    };
    await timeUpdater();
    setInterval(timeUpdater, 60000); // once per minute
  }

  private async setSchedulePostUpdateTimer() {
    const scheduleWriter = async () => {
      try {
        var guild = await this.guilds.fetch(guildId);
        if (guild === undefined || guild === null) return;
        updateSchedules(this.dbClient, guild.channels);
      } catch {
        (err: string) => console.log(err);
      }
    };
    await scheduleWriter();
    setInterval(scheduleWriter, 60 * 60000); // once per hour
  }

  private async setPostLobbyFromScheduleTimer() {
    const lobbyPoster = async () => {
      var guild = await this.guilds.fetch(guildId);
      if (guild === undefined || guild === null) return;
      await insertScheduledLobbies(guild.channels, this.dbClient);
    };
    await lobbyPoster();
    setInterval(lobbyPoster, 60 * 60000); // once per hour
  }

  private async setLeaderBoardPostTimer() {
    const leaderBordPoster = async () => {
      await postReferralLeaderboard(this);
    };
    await findLeaderBoardMessage(this);
    await postReferralLeaderboard(this);
    setInterval(leaderBordPoster, 60 * 60000); // once per hour
  }
}
