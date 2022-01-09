import { Message } from "discord.js";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";
import { reactNegative, reactPositive } from "../misc/messageHelper";
import { postSchedules } from "../logic/lobbyScheduling/scheduleManagement";

export default async (message: Message, client: DFZDiscordClient) => {
  try {
    await tryPostSchedules(message, client);
  } catch (error) {
    reactNegative(message, error as string);
  }
};

async function tryPostSchedules(message: Message, client: DFZDiscordClient) {
  if (!message.guild) throw new Error("Only guild messages");
  await postSchedules({ client: client, guild: message.guild });
  reactPositive(message, "I posted this week's schedules");
}
