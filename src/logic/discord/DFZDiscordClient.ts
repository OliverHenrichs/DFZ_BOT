import {
  Client,
  Collection,
  Guild,
  Intents,
  NewsChannel,
  OAuth2Guild,
  Snowflake,
  TextChannel,
} from "discord.js";
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
import { ScheduleSerializer } from "../serializers/ScheduleSerializer";
import { TimeInMs } from "../time/TimeConverter";
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
      const guildCollection = await this.getGuilds();
      for await (const guild of guildCollection) {
        const realGuild = await guild[1].fetch();
        await realGuild.roles.fetch();
      }
    };

    this.tryActionWithErrorLog(fetcher, "Error fetching roles");
  }

  private async fetchSlashCommands() {
    await this.slashCommandRegistrar.registerCommandFiles(this);
    await this.slashCommandRegistrar.tryRegisterSlashCommands();
    const guild = await this.getDFZGuild();
    await this.slashCommandRegistrar.setCommandPermissions(guild);
  }

  private async fetchLobbyMessages() {
    const fetcher = async () => {
      const guild = await this.getDFZGuild();
      for (const channelId of ChannelManager.lobbyChannels) {
        await this.fetchLobbyMessagesInChannel(guild, channelId);
      }
    };
    this.tryActionWithErrorLog(fetcher, "Error fetching lobby messages");
  }

  private async getGuilds(): Promise<Collection<Snowflake, OAuth2Guild>> {
    return await this.guilds.fetch();
  }

  private async getDFZGuild() {
    return await this.guilds.fetch(dfzGuildId);
  }

  private async fetchLobbyMessagesInChannel(guild: Guild, channelId: string) {
    const gc = await this.findChannel(guild, channelId);
    const lobbies = await Lobby.getChannelLobbies(
      this.dbClient,
      guild.id,
      channelId
    );
    for (const lobby of lobbies) {
      await gc.messages.fetch(lobby.messageId);
    }
  }

  private async fetchScheduleMessages() {
    const fetcher = async () => {
      const schedules = await this.fetchSchedules();
      var fetchedSchedulePosts = this.getUniqueSchedulePosts(schedules);

      var guild = await this.getDFZGuild();
      for (const post of fetchedSchedulePosts) {
        const channel = await this.findChannel(guild, post.channelId);

        channel.messages.fetch(post.messageId);
      }
    };
    this.tryActionWithErrorLog(fetcher, "Error fetching schedule messages");
  }

  private async fetchSchedules(): Promise<Schedule[]> {
    const guilds = await this.getGuilds();
    const scheduleListOfLists = await Promise.all(
      guilds.map(async (guild) => {
        const serializer = new ScheduleSerializer({
          dbClient: this.dbClient,
          guildId: guild.id,
        });
        return serializer.get();
      })
    );

    return Array.prototype.concat.apply([], scheduleListOfLists);
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
      const guilds = await this.getGuilds();
      guilds.map(async (guild) => {
        const realGuild = await guild.fetch();
        LobbyTimeController.checkAndUpdateLobbies(client, realGuild);
      });
    };

    const intervalFun = this.createIntervalTask(updateFun);
    await intervalFun();
    this.internalTimeouts.push(setInterval(intervalFun, TimeInMs.oneMinute));
  }

  private async setDeleteDeprecatedSchedulesTimer() {
    const updateFun = async (client: DFZDiscordClient) => {
      await tryRemoveDeprecatedSchedules(client.dbClient);
    };
    const intervalFun = this.createIntervalTask(updateFun);
    await intervalFun();
    this.internalTimeouts.push(setInterval(intervalFun, TimeInMs.oneHour));
  }

  private async setSchedulePostUpdateTimer() {
    const scheduleWriter = async (client: DFZDiscordClient) => {
      const collection = await this.getGuilds();
      collection.map(async (oAuthGuild) => {
        const guild = await oAuthGuild.fetch();
        await postSchedules({ client, guild });
      });
    };
    const intervalFun = this.createIntervalTask(scheduleWriter);
    await intervalFun();
    this.internalTimeouts.push(setInterval(intervalFun, TimeInMs.oneHour));
  }

  private async setPostLobbyFromScheduleTimer() {
    const lobbyPoster = async (client: DFZDiscordClient) => {
      const guild = await client.getDFZGuild();
      await insertScheduledLobbies(guild.channels, client.dbClient);
    };
    const intervalFun = this.createIntervalTask(lobbyPoster);
    await intervalFun();
    this.internalTimeouts.push(setInterval(intervalFun, TimeInMs.oneHour));
  }

  private async setLeaderBoardPostTimer() {
    const intervalFun = this.createIntervalTask(
      ReferrerLeaderBoardHandler.postReferralLeaderboard
    );
    await ReferrerLeaderBoardHandler.findLeaderBoardMessage(this);
    await intervalFun();
    this.internalTimeouts.push(setInterval(intervalFun, TimeInMs.oneHour));
  }
}
