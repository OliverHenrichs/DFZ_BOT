import * as dotenv from "dotenv";
dotenv.config();

import { DFZDiscordClient } from "./src/types/discord/DFZDiscordClient";
import { GoogleCalendarManager } from "./src/types/gcalendar/GoogleCalendarManager";
import Website from "./website/website";

const client = new DFZDiscordClient();
var website = {};

client
  .login(process.env.BOT_TOKEN)
  .then(() => {
    website = new Website(client);
  })
  .then(() => {
    GoogleCalendarManager.login();
  })
  .catch((err: any) => console.log(err));
