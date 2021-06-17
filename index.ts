import * as dotenv from "dotenv";
dotenv.config();

import { DFZDiscordClient } from "./src/types/DFZDiscordClient";
import Website from "./website/website";

const client = new DFZDiscordClient();
var website = {};

client
  .login(process.env.BOT_TOKEN)
  .then((res: string) => {
    website = new Website(
      process.env.WEBSITE_PASSWD ? process.env.WEBSITE_PASSWD : "",
      client
    );
  })
  .catch((err: any) => console.log(err));
