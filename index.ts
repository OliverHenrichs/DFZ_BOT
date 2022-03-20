import { DFZDiscordClient } from "./src/logic/discord/DFZDiscordClient";
import { TimeInMs } from "./src/logic/time/TimeConverter";
import Website from "./website/website";

let website = {};
const client = new DFZDiscordClient();
client
  .login(process.env.BOT_TOKEN)
  .then(() => {
    const websiteCreator = () => {
      website = new Website(client);
    };
    setTimeout(websiteCreator, TimeInMs.oneMinute);
  })
  .catch((err: any) => console.log(err));
