import {Message} from "discord.js";

export interface IReactionData {
    message: Message,
    reply: string,
    deleteMessage: boolean
}