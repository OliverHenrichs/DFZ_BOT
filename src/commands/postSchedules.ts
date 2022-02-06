import {Message} from "discord.js";
import {DFZDiscordClient} from "../logic/discord/DFZDiscordClient";
import {SchedulePoster} from "../logic/lobbyScheduling/SchedulePoster";
import {reactNegative, reactPositive} from "../misc/messageHelper";

export default async (message: Message, client: DFZDiscordClient) => {
    try {
        await tryPostSchedules(message, client);
    } catch (error) {
        await reactNegative({message, reply: error as string, deleteMessage: true});
    }
};

async function tryPostSchedules(message: Message, client: DFZDiscordClient) {
    if (!message.guild) throw new Error("Only guild messages");
    await SchedulePoster.postSchedules({client: client, guild: message.guild});
    await reactPositive({message, reply: "I posted this week's schedules", deleteMessage: true});
}
