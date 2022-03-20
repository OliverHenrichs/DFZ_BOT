import { Guild } from "discord.js";
import express from "express";
import { Express } from "express-serve-static-core";
import http from "http";
import https from "https";
import { DFZDiscordClient } from "../src/logic/discord/DFZDiscordClient";
import { Coach } from "../src/logic/serializables/Coach";
import { CoachSerializer } from "../src/logic/serializers/CoachSerializer";
import { TimeInMs } from "../src/logic/time/TimeConverter";
import { dfzGuildId } from "../src/misc/constants";
import { registerEndpoints } from "./endPoints";
import { setupMiddleWares } from "./middlewares";
import { tryGetSSLCredentials } from "./ssl";

export default class Website {
  app: Express;
  coachList: Coach[] = [];
  useHttps: boolean = false;
  private client: DFZDiscordClient;
  private httpServer: http.Server | undefined;
  private httpsServer: https.Server | undefined;
  private httpsCredentials: {
    key: string;
    cert: string;
    ca: string;
  } = {
    key: "",
    cert: "",
    ca: "",
  };

  constructor(client: DFZDiscordClient) {
    this.client = client;

    this.app = express();
    setupMiddleWares(this.app);
    void registerEndpoints(this);
    void this.setupCoachHallOfFame();

    this.trySetupHttps();
    this.setupHttp();
  }

  private static async setGuildDisplayName(someObject: any, guild: Guild) {
    try {
      const member = await guild.members.fetch(someObject.userId);
      someObject.displayName = member.displayName;
    } catch {
      someObject.displayName = "Unknown";
    }
  }

  private trySetupHttps() {
    try {
      this.setupHttps();
    } catch (error) {
      console.log(`Did not set https: ${error}`);
    }
  }

  private setupHttps() {
    this.httpsCredentials = tryGetSSLCredentials();
    this.useHttps = true;

    this.httpsServer = https.createServer(this.httpsCredentials, this.app);
    const port = 444;
    this.httpsServer.listen(port, () => {
      console.log(`HTTPS Server running on port ${port}`);
    });
  }

  private setupHttp() {
    this.httpServer = http.createServer(this.app);
    const port = 81;
    this.httpServer.listen(port, () => {
      console.log(`HTTP Server running on port ${port}`);
    });
  }

  private async setupCoachHallOfFame() {
    await this.tryGetCoachList();
    setInterval(this.tryGetCoachList.bind(this), TimeInMs.twoHours);
  }

  private async tryGetCoachList() {
    try {
      await this.getCoachList();
    } catch (e) {
      console.log(`Failed updating coaches\nReason:\n${e}`);
    }
  }

  private async getCoachList() {
    const serializer = new CoachSerializer({
      guildId: dfzGuildId,
      dbClient: this.client.dbClient,
    });
    const nativeCoachList = await serializer.getSorted();

    this.coachList = await this.addCoachDisplayNames(nativeCoachList);
  }

  private async addCoachDisplayNames(coaches: Coach[]) {
    const guild = await this.client.guilds.fetch(dfzGuildId);
    for (const coach of coaches) {
      await Website.setGuildDisplayName(coach, guild);
    }
    return coaches;
  }
}
