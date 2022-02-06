import {Message} from "discord.js";
import apply from "../commands/apply";
import helpUser from "../commands/helpUser";
import highScore from "../commands/highScore";
import kick from "../commands/kick";
import postLobby from "../commands/postLobby";
import postSchedules from "../commands/postSchedules";
import updateLobby from "../commands/updateLobby";
import {ChannelManager} from "../logic/discord/DFZChannelManager";
import {DFZDiscordClient} from "../logic/discord/DFZDiscordClient";
import {adminRoles, companionRole, findRole,} from "../logic/discord/roleManagement";
import {botId} from "../misc/constants";
import {reactNegative} from "../misc/messageHelper";

const PREFIX = "!";

/**
 * Main message handler.
 * Filter messages and calls all command subroutines.
 */
module.exports = async (client: DFZDiscordClient, message: Message) => {
    // Get content
    const content = message.content;

    // Ignore any message that doesn't start with the correct prefix.
    if (!content.startsWith(PREFIX)) {
        return;
    }

    // Ignore messages from self
    if (message.author.id === botId) {
        return;
    }

    // Ignore non-guild-members
    if (message.member === null) return;

    // Ignore DMs
    if (message.channel.type === "DM") {
        return reactNegative({message, reply: "Bot doesn't support DMs!", deleteMessage: true});
    }

    // handle applications
    if (
        ChannelManager.signupChannel === message.channel.id &&
        content.startsWith("!apply")
    ) {
        return apply(client, message);
    }

    // Ignore messages outside of bot channels
    if (!ChannelManager.isWatchingChannel(message.channel.id)) {
        return reactNegative({
                message,
                reply: "I only listen to messages in the channels " + ChannelManager.combinedChannelStrings,
                deleteMessage: true
            }
        );
    }

    // handle admin commands
    if (findRole(message.member, adminRoles) != undefined) {
        if (content.startsWith("!help") || content.startsWith("!helpme")) {
            return helpUser(message);
        }
        if (content.startsWith("!schedules")) {
            return postSchedules(message, client);
        }
        if (content.startsWith("!post")) {
            return postLobby(message, client.dbClient);
        }
        if (content.startsWith("!update")) {
            return updateLobby(message, client.dbClient);
        }
        if (content.startsWith("!highscore")) {
            return highScore(message, client.dbClient);
        }
        if (content.startsWith("!kick")) {
            return kick(message, client.dbClient);
        }
    }

    // handle companion commands
    if (findRole(message.member, [companionRole]) != undefined) {
        if (content.startsWith("!post")) {
            return postLobby(message, client.dbClient);
        }
    }
};
