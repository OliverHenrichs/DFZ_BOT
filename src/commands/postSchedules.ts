import { Message } from "discord.js";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";
import { reactNegative, reactPositive } from "../misc/messageHelper";
import { postSchedules } from "../misc/scheduleManagement";

export default async (message: Message, client: DFZDiscordClient) => {
  postSchedules(client)
    .then(() => {
      reactPositive(message, "I posted this week's schedules");
    })
    .catch((error) => {
      reactNegative(message, error);
    });
};
