import * as dotenv from "dotenv";
dotenv.config();

import { DFZDiscordClient } from "./src/types/DFZDiscordClient";
import Website from "./website/website";

const client = new DFZDiscordClient();
var website = {};

client
  .login(process.env.BOT_TOKEN)
  .then(() => {
    website = new Website(client);
  })
  .catch((err: any) => console.log(err));
