import { Client, Guild, Intents, NewsChannel, TextChannel } from "discord.js";
import { readdirSync } from "fs";
import { dfzGuildId } from "../../misc/constants";
import {
  insertScheduledLobbies,
  postSchedules,
  tryRemoveDeprecatedSchedules,
} from "../../misc/scheduleManagement";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { ReferrerLeaderBoardHandler } from "../highscore/ReferrerLeaderBoardHandler";
import { LobbyTimeout } from "../lobby/interfaces/LobbyTimeout";
import { LobbyTimeController } from "../lobby/LobbyTimeController";
import { Lobby } from "../serializables/lobby";
import { Schedule } from "../serializables/schedule";
import { ScheduleSerializer } from "../serializers/scheduleSerializer";
import { TimeConverter } from "../time/TimeConverter";
import { ChannelManager } from "./DFZChannelManager";
import { ILobbyMenu } from "./interfaces/ILobbyMenu";
import { IScheduleInfo } from "./interfaces/IScheduleInfo";
import { SlashCommandRegistrator } from "./SlashCommandRegistrator";

export class DFZDiscordClient extends Client {
  public dbClient: DFZDataBaseClient;
  public timeouts: LobbyTimeout[] = [];
  public lobbyMenus: ILobbyMenu[] = [];
  public slashCommandRegistrar = new SlashCommandRegistrator(this);

  private internalTimeouts: NodeJS.Timeout[] = [];

  constructor() {
    super({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      ],
    });

    this.setupDiscordEventHandlers();
    this.dbClient = new DFZDataBaseClient();
  }

  public shutdown() {
    this.internalTimeouts.forEach((to) => {
      clearInterval(to);
    });
    this.destroy();
  }

  private setupDiscordEventHandlers() {
    const files = readdirSync(`${__dirname}/../../events/`);

    for (const file of files) {
      const eventHandler = require(`${__dirname}/../../events/${file}`);
      const eventName = file.split(".")[0];
      this.on(eventName, (...args: any) => eventHandler(this, ...args));
    }
  }

  public async onReady() {
    try {
      await this.setupBot();
    } catch (error) {
      console.log(`Error while setting up bot: ${error}`);
    }
  }

  private async setupBot() {
    await this.dbClient.tryCreateDataBaseTables();
    await this.fetchDiscordData();
    await this.setIntervalTasks();
  }

  private async fetchDiscordData() {
    await this.fetchRoles();
    await this.fetchSlashCommands();
    await this.fetchLobbyMessages();
    await this.fetchScheduleMessages();
  }

  private async setIntervalTasks() {
    await this.setLobbyPostUpdateTimer();
    await this.setDeleteDeprecatedSchedulesTimer();
    await this.setSchedulePostUpdateTimer();
    await this.setPostLobbyFromScheduleTimer();
    await this.setLeaderBoardPostTimer();
  }

  private async fetchRoles() {
    const fetcher = async () => {
      const guild = await this.getGuild();
      await guild.roles.fetch();
    };
    this.tryActionWithErrorLog(fetcher, "Error fetching roles");
  }

  private async fetchSlashCommands() {
    await this.slashCommandRegistrar.registerCommandFiles(this);
    await this.slashCommandRegistrar.tryRegisterSlashCommands();
    const guild = await this.getGuild();
    await this.slashCommandRegistrar.setCommandPermissions(guild);
  }

  private async fetchLobbyMessages() {
    const fetcher = async () => {
      const guild = await this.getGuild();
      for (const channelId of ChannelManager.lobbyChannels) {
        await this.fetchLobbyMessagesInChannel(guild, channelId);
      }
    };
    this.tryActionWithErrorLog(fetcher, "Error fetching lobby messages");
  }

  private async getGuild() {
    return await this.guilds.fetch(dfzGuildId);
  }

  private async fetchLobbyMessagesInChannel(guild: Guild, channelId: string) {
    const gc = await this.findChannel(guild, channelId);
    const lobbies = await Lobby.getChannelLobbies(this.dbClient, channelId);
    for (const lobby of lobbies) {
      await gc.messages.fetch(lobby.messageId);
    }
  }

  private async fetchScheduleMessages() {
    const fetcher = async () => {
      const schedules = await this.fetchSchedules();
      var fetchedSchedulePosts = this.getUniqueSchedulePosts(schedules);

      var guild = await this.getGuild();
      for (const post of fetchedSchedulePosts) {
        const channel = await this.findChannel(guild, post.channelId);

        channel.messages.fetch(post.messageId);
      }
    };
    this.tryActionWithErrorLog(fetcher, "Error fetching schedule messages");
  }

  private async fetchSchedules() {
    const serializer = new ScheduleSerializer(this.dbClient);
    return await serializer.get();
  }

  private getUniqueSchedulePosts(schedules: Array<Schedule>): IScheduleInfo[] {
    var fetchedSchedulePosts: IScheduleInfo[] = [];

    for (const schedule of schedules) {
      this.maybeFetchSchedulePost(schedule, fetchedSchedulePosts);
    }
    return fetchedSchedulePosts;
  }

  private async maybeFetchSchedulePost(
    schedule: Schedule,
    fetchedSchedulePosts: IScheduleInfo[]
  ) {
    const containsPost: boolean = this.isScheduleFetched(
      schedule,
      fetchedSchedulePosts
    );
    if (!containsPost)
      fetchedSchedulePosts.push({
        messageId: schedule.messageId,
        channelId: schedule.channelId,
      });
  }

  private isScheduleFetched(
    schedule: Schedule,
    fetchedSchedulePosts: IScheduleInfo[]
  ): boolean {
    const index = fetchedSchedulePosts.findIndex(
      (fetched) =>
        fetched.messageId === schedule.messageId &&
        fetched.channelId === schedule.channelId
    );
    return index !== -1;
  }

  public async findChannel(
    guild: Guild,
    channelId: string
  ): Promise<TextChannel | NewsChannel> {
    const channel = await guild.channels.fetch(channelId);
    if (!channel || !channel.isText()) {
      throw new Error("Did not find channel when fetching messages");
    }

    return channel;
  }

  private createIntervalTask(
    taskFun: (client: DFZDiscordClient) => Promise<void>
  ) {
    return async () => {
      try {
        await taskFun(this);
      } catch {
        (err: string) => console.log(err);
      }
    };
  }

  private async tryActionWithErrorLog(
    action: () => Promise<void>,
    msg: string
  ) {
    try {
      await action();
    } catch (error) {
      console.warn(`${error}: ${msg}`);
    }
  }

  private async setLobbyPostUpdateTimer() {
    const updateFun = async (client: DFZDiscordClient) => {
      await LobbyTimeController.checkAndUpdateLobbies(client);
    };

    const intervalFun = this.createIntervalTask(updateFun);
    await intervalFun();
    this.internalTimeouts.push(setInterval(intervalFun, TimeConverter.minToMs));
  }

  private async setDeleteDeprecatedSchedulesTimer() {
    const updateFun = async (client: DFZDiscordClient) => {
      await tryRemoveDeprecatedSchedules(client.dbClient);
    };
    const intervalFun = this.createIntervalTask(updateFun);
    await intervalFun();
    this.internalTimeouts.push(setInterval(intervalFun, TimeConverter.hToMs));
  }

  private async setSchedulePostUpdateTimer() {
    const scheduleWriter = async (client: DFZDiscordClient) => {
      await postSchedules(client);
    };
    const intervalFun = this.createIntervalTask(scheduleWriter);
    await intervalFun();
    this.internalTimeouts.push(setInterval(intervalFun, TimeConverter.hToMs));
  }

  private async setPostLobbyFromScheduleTimer() {
    const lobbyPoster = async (client: DFZDiscordClient) => {
      const guild = await client.getGuild();
      await insertScheduledLobbies(guild.channels, client.dbClient);
    };
    const intervalFun = this.createIntervalTask(lobbyPoster);
    await intervalFun();
    this.internalTimeouts.push(setInterval(intervalFun, TimeConverter.hToMs));
  }

  private async setLeaderBoardPostTimer() {
    const intervalFun = this.createIntervalTask(
      ReferrerLeaderBoardHandler.postReferralLeaderboard
    );
    await ReferrerLeaderBoardHandler.findLeaderBoardMessage(this);
    await intervalFun();
    this.internalTimeouts.push(setInterval(intervalFun, TimeConverter.hToMs));
  }
}
