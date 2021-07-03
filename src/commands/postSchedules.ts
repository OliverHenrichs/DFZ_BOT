import { Message } from "discord.js";
import { reactNegative, reactPositive } from "../misc/messageHelper";
import { postSchedules } from "../misc/scheduleManagement";
import { DFZDiscordClient } from "../types/discord/DFZDiscordClient";

export default async (message: Message, client: DFZDiscordClient) => {
  postSchedules(client)
    .then((text) => {
      reactPositive(message, text);
    })
    .catch((error) => {
      reactNegative(message, error);
    });
};
