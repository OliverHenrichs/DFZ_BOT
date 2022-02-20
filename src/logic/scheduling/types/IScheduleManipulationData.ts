import { MessageReaction, User } from "discord.js";
import { DFZDiscordClient } from "../../discord/DFZDiscordClient";

export interface IScheduleManipulationData {
  client: DFZDiscordClient;
  reaction: MessageReaction;
  user: User;
}
