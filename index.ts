import { DFZDiscordClient } from "./src/logic/discord/DFZDiscordClient";
import { GoogleCalendarManager } from "./src/logic/gcalendar/GoogleCalendarManager";
import { TimeInMs } from "./src/logic/time/TimeConverter";
import Website from "./website/website";

var website = {};
const client = new DFZDiscordClient();
client
  .login(process.env.BOT_TOKEN)
  .then(() => {
    const websiteCreator = () => {
      website = new Website(client);
    };
    setTimeout(websiteCreator, TimeInMs.oneMinute);
  })
  .then(() => {
    GoogleCalendarManager.login();
  })
  .catch((err: any) => console.log(err));
