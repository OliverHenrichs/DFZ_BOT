import express, { Request, Response } from "express";
import { DFZDiscordClient } from "../src/types/DFZDiscordClient";

import hbs from "express-handlebars";
import http from "http";
import https from "https";
import path from "path";
import { readFileSync } from "fs";
import { CoachSerializer } from "../src/types/serializers/coachSerializer";
import { ReferrerSerializer } from "../src/types/serializers/referrerSerializer";

var visitCounter = require("express-visit-counter"); // no types in npm

const guildId: string =
  process.env.GUILD !== undefined ? process.env.GUILD : "";

// SSL credentials
interface credentials {
  key: undefined | string;
  cert: undefined | string;
  ca: undefined | string;
}
var credentials: credentials = {
  key: undefined,
  cert: undefined,
  ca: undefined,
};

var justHttp = false;
try {
  credentials.key = readFileSync(
    "/etc/letsencrypt/live/dotafromzero.com/privkey.pem",
    "utf8"
  );
  credentials.cert = readFileSync(
    "/etc/letsencrypt/live/dotafromzero.com/cert.pem",
    "utf8"
  );
  credentials.ca = readFileSync(
    "/etc/letsencrypt/live/dotafromzero.com/chain.pem",
    "utf8"
  );
} catch (e) {
  justHttp = true;
  console.log("Could not find https-cert, only loading http-server");
}

// rate limit
var RateLimit = require("express-rate-limit");
var limiter = new RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  delayMs: 0, // disable delaying - full speed until the max limit is reached
});

const _title = "No Bullshit. No Ads. Just DOTA.";

export default class WebSocket {
  token: string;
  coachList: {};
  referrerList: {};
  client: DFZDiscordClient;
  app: any;
  httpServer: any;
  useHttps: boolean;
  credentials: {
    key: undefined | string;
    cert: undefined | string;
    ca: undefined | string;
  };
  httpsServer: any;

  constructor(token: string, client: DFZDiscordClient) {
    this.token = token;
    this.coachList = {};
    this.referrerList = {};
    this.client = client;

    this.app = express();

    this.app.use(limiter);

    this.app.engine(
      "hbs",
      hbs({
        extname: "hbs",
        defaultLayout: "layout",
        layoutsDir: __dirname + "/layouts",
      })
    );
    this.app.set("views", path.join(__dirname, "views"));
    this.app.set("view engine", "hbs");

    this.app.use(express.static(path.join(__dirname, "public")));
    this.app.use(visitCounter.initialize());

    // this.app.use(bodyParser.urlencoded({extended: false}));
    // this.app.use(bodyParser.json());

    this.registerRoots();

    this.setupHallOfFame();

    // Starting both http & https servers
    this.httpServer = http.createServer(this.app);
    this.httpServer.listen(80, () => {
      console.log("HTTP Server running on port 80");
    });

    this.credentials = credentials;
    this.useHttps = !justHttp;
    if (this.useHttps) {
      this.httpsServer = https.createServer(this.credentials, this.app);
      this.httpsServer.listen(443, () => {
        console.log("HTTPS Server running on port 443");
      });
    }
  }

  async updateCoachList() {
    try {
      console.log("In updateCoachList()");

      if (this.client.dbClient.pool === undefined) return;

      var guild = await this.client.guilds.fetch(guildId);

      const serializer = new CoachSerializer(this.client.dbClient);
      var nativeCoachList = await serializer.getSorted();
      for (let i = 0; i < nativeCoachList.length; i++) {
        const coach: any = nativeCoachList[i]; // in order to add nick, change type to any
        try {
          var member = await guild.members.fetch(coach.userId);
          coach.nick = member.displayName;
        } catch {
          coach.nick = "Unknown";
        }
      }
      this.coachList = nativeCoachList;
    } catch (e) {
      console.log(`Failed updating coaches\nReason:\n${e}`);
    }
  }

  async updateReferrerList() {
    if (this.client.dbClient.pool === undefined) return;

    const serializer = new ReferrerSerializer(this.client.dbClient);
    this.referrerList = await serializer.getSorted();
  }

  async setupHallOfFame() {
    await this.updateCoachList();
    setInterval(this.updateCoachList.bind(this), 2 * 60 * 60000); //2 * 60 * 60000);
    await this.updateReferrerList();
    setInterval(this.updateReferrerList.bind(this), 2 * 60 * 60000);
  }

  redirectHttps(req: Request, res: Response) {
    if (!req.secure && this.useHttps) {
      res.redirect("https://" + req.headers.host + req.url);
      return true;
    }
    return false;
  }

  async registerRoots() {
    this.app.get("/", async (req: Request, res: Response) => {
      if (this.redirectHttps(req, res)) {
        return;
      }
      var vc = await visitCounter.Loader.getCount();
      res.render("index", {
        title: _title,
        referrers: this.referrerList,
        visitorCount: vc,
      });
    });
    this.app.get("/join", async (req: Request, res: Response) => {
      if (this.redirectHttps(req, res)) {
        return;
      }
      var vc = await visitCounter.Loader.getCount();
      res.render("joinLink", {
        title: _title,
        visitorCount: vc,
      });
    });

    this.app.get("/halloffame", async (req: Request, res: Response) => {
      if (this.redirectHttps(req, res)) {
        return;
      }
      var vc = await visitCounter.Loader.getCount();
      res.render("hallOfFame", {
        title: _title,
        coaches: this.coachList,
        visitorCount: vc,
      });
    });

    // this.app.post('/sendMessage', (req: Request, res: Response) => {
    //     var _token = req.body.token;
    //     var text = req.body.text;
    //     var channelId = req.body.channelid;

    //     if(!this.checkToken(_token))
    //         return;

    //     var channel = this.client.guilds.fetch(process.env.GUILD).channels.get(channelId)

    //     if(channel)
    //         channel.send(text);
    // })
  }
}
