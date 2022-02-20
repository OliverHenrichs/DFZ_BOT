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
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { SQLTableCreator } from "../database/SQLTableCreator";
import { ILobbyTimeout } from "../lobby/interfaces/ILobbyTimeout";
import { LobbyTimeController } from "../lobby/LobbyTimeController";
import { LobbyScheduler } from "../scheduling/LobbyScheduler";
import { SchedulePoster } from "../scheduling/SchedulePoster";
import { ScheduleRemover } from "../scheduling/ScheduleRemover";
import { Lobby } from "../serializables/Lobby";
import { Schedule } from "../serializables/Schedule";
import { ScheduleSerializer } from "../serializers/ScheduleSerializer";
import { TimeInMs } from "../time/TimeConverter";
import { ChannelManager } from "./DFZChannelManager";
import { ILobbyMenu } from "./interfaces/ILobbyMenu";
import { IScheduleInfo } from "./interfaces/IScheduleInfo";
import { SlashCommandRegistrator } from "./SlashCommandRegistrator";
import { ErrorMessages } from "./enums/ErrorMessages";

export class DFZDiscordClient extends Client {
  public dbClient: DFZDataBaseClient;
  public timeouts: ILobbyTimeout[] = [];
  public slashCommandMenus: ILobbyMenu[] = [];
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

  private static async tryActionWithErrorLog(
    action: () => Promise<void>,
    msg: string
  ) {
    try {
      await action();
    } catch (error) {
      console.warn(`${error}: ${msg}`);
    }
  }

  public async onReady() {
    try {
      await this.setupBot();
    } catch (error) {
      console.log(`Error while setting up bot: ${error}`);
    }
  }

  public async findChannel(
    guild: Guild,
    channelId: string
  ): Promise<TextChannel | NewsChannel> {
    const channel = await guild.channels.fetch(channelId);
    if (!channel || !channel.isText()) {
      throw new Error(ErrorMessages.messageFetching);
    }

    return channel;
  }

  private setupDiscordEventHandlers() {
    const files = readdirSync(`${__dirname}/../../events/`);

    for (const file of files) {
      const eventHandler = require(`${__dirname}/../../events/${file}`);
      const eventName = file.split(".")[0];
      this.on(eventName, (...args: any) => eventHandler(this, ...args));
    }
  }

  private async setupBot() {
    await SQLTableCreator.tryCreateDataBaseTables(this.dbClient.pool);
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
  }

  private async fetchRoles() {
    const fetcher = async () => {
      const guildCollection = await this.getGuilds();
      for await (const guild of guildCollection) {
        const realGuild = await guild[1].fetch();
        await realGuild.roles.fetch();
      }
    };

    await DFZDiscordClient.tryActionWithErrorLog(
      fetcher,
      ErrorMessages.roleFetching
    );
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
    await DFZDiscordClient.tryActionWithErrorLog(
      fetcher,
      ErrorMessages.lobbyFetching
    );
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
      const fetchedSchedulePosts = await this.getUniqueSchedulePosts(schedules);

      const guild = await this.getDFZGuild();
      for (const post of fetchedSchedulePosts) {
        const channel = await this.findChannel(guild, post.channelId);

        await channel.messages.fetch(post.messageId);
      }
    };
    await DFZDiscordClient.tryActionWithErrorLog(
      fetcher,
      ErrorMessages.scheduleFetching
    );
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

  private async getUniqueSchedulePosts(
    schedules: Array<Schedule>
  ): Promise<IScheduleInfo[]> {
    return schedules.reduce<IScheduleInfo[]>((schedulePosts, schedule) => {
      return this.maybeAddSchedule(schedule, schedulePosts);
    }, []);
  }

  private maybeAddSchedule(
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
    return fetchedSchedulePosts;
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

  private createIntervalTask(
    taskFun: (client: DFZDiscordClient) => Promise<void>
  ) {
    return async () => {
      try {
        await taskFun(this);
      } catch (err) {
        console.log(err);
      }
    };
  }

  private async setLobbyPostUpdateTimer() {
    const updateFun = async (client: DFZDiscordClient) => {
      const guilds = await this.getGuilds();
      guilds.map(async (guild) => {
        const realGuild = await guild.fetch();
        await LobbyTimeController.checkAndUpdateLobbies(client, realGuild);
      });
    };

    const intervalFun = this.createIntervalTask(updateFun);
    await intervalFun();
    this.internalTimeouts.push(setInterval(intervalFun, TimeInMs.oneMinute));
  }

  private async setDeleteDeprecatedSchedulesTimer() {
    const updateFun = async (client: DFZDiscordClient) => {
      await ScheduleRemover.tryRemoveDeprecatedSchedules(client.dbClient);
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
        await SchedulePoster.postSchedules({ client, guild });
      });
    };
    const intervalFun = this.createIntervalTask(scheduleWriter);
    await intervalFun();
    this.internalTimeouts.push(setInterval(intervalFun, TimeInMs.oneHour));
  }

  private async setPostLobbyFromScheduleTimer() {
    const lobbyPoster = async (client: DFZDiscordClient) => {
      const guild = await client.getDFZGuild();
      await LobbyScheduler.insertScheduledLobbies(
        guild.channels,
        client.dbClient
      );
    };
    const intervalFun = this.createIntervalTask(lobbyPoster);
    await intervalFun();
    this.internalTimeouts.push(setInterval(intervalFun, TimeInMs.oneHour));
  }
}
