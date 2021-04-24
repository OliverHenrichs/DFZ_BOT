import * as dotenv from 'dotenv';
import { readdir } from 'fs';
import { createDBHandle, createScheduleTable, createLobbyTable, createOptionsTable, createCoachTable, createPlayerTable, createReferrerTable } from './src/misc/database';
import { DFZDiscordClient } from './src/misc/types/DFZDiscordClient';
dotenv.config();
import Website from "./website/website";

const client = new DFZDiscordClient(createDBHandle());
//client.dbHandle.dfz_debugMode = true;

var ws = {};

// setup discord event handlers
readdir("./src/events/", (_err: any, files: any[]) => {
  files.forEach((file) => {
    if (file.endsWith("ts")) return;
    const eventHandler = require(`./src/events/${file}`);
    const eventName = file.split(".")[0];
    client.on(eventName, (...args: any) => eventHandler(client, ...args));
  });
});

// setup-chain
createScheduleTable(client.dbHandle)
  .then(() => {
    return createLobbyTable(client.dbHandle);
  })
  .then(() => {
    return createOptionsTable(client.dbHandle);
  })
  .then(() => {
    return createCoachTable(client.dbHandle);
  })
  .then(() => {
    return createPlayerTable(client.dbHandle);
  })
  .then(() => {
    return createReferrerTable(client.dbHandle);
  })
  .then(() => {
    // login to discord client
    return client.login(process.env.BOT_TOKEN);
  })
  .then(() => {
    // login to discord client
    ws = new Website(process.env.WEBSITE_PASSWD ? process.env.WEBSITE_PASSWD : "", client);
  })
  .catch((err: any) => console.log(err));
