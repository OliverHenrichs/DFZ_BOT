require("dotenv").config();
const disc = require("discord.js");
const Website = require("./website/website");
const fs = require("fs");
var ws = {};
const client = new disc.Client({ autoReconnect: true });

const dB = require("./src/misc/database");
// get db-access
client.dbHandle = dB.createPool();
//client.dbHandle.dfz_debugMode = true;

// setup discord event handlers
fs.readdir("./src/events/", (_err: any, files: any[]) => {
  files.forEach((file) => {
    if (file.endsWith("ts")) return;
    const eventHandler = require(`./src/events/${file}`);
    const eventName = file.split(".")[0];
    client.on(eventName, (...args: any) => eventHandler(client, ...args));
  });
});

// setup-chain
dB.createScheduleTable(client.dbHandle)
  .then(() => {
    return dB.createLobbyTable(client.dbHandle);
  })
  .then(() => {
    return dB.createOptionsTable(client.dbHandle);
  })
  .then(() => {
    return dB.createCoachTable(client.dbHandle);
  })
  .then(() => {
    return dB.createPlayerTable(client.dbHandle);
  })
  .then(() => {
    return dB.createReferrerTable(client.dbHandle);
  })
  .then(() => {
    // login to discord client
    return client.login(process.env.BOT_TOKEN);
  })
  .then(() => {
    // login to discord client
    ws = new Website(process.env.WEBSITE_PASSWD, client);
  })
  .catch((err: any) => console.log(err));
