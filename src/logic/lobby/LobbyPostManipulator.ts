import {roleMention} from "@discordjs/builders";
import {Message, MessageEmbed, TextBasedChannels} from "discord.js";
import {
    getCoachCountByLobbyType,
    getLobbyNameByType,
    getLobbyPostNameByType,
    getPlayersPerLobbyByLobbyType,
    isRoleBasedLobbyType,
    lobbyTypes,
} from "../../misc/constants";
import {createLobbyPostReactions} from "../../misc/messageHelper";
import {createTeams} from "../../misc/userHelper";
import {DFZDataBaseClient} from "../database/DFZDataBaseClient";
import {ChannelManager} from "../discord/DFZChannelManager";
import {DFZDiscordClient} from "../discord/DFZDiscordClient";
import {EmbeddingCreator} from "../discord/EmbeddingCreator";
import {getRegionalRoleString, getRoleMentions,} from "../discord/roleManagement";
import {Lobby} from "../serializables/lobby";
import {LobbySerializer} from "../serializers/LobbySerializer";
import {SerializeUtils} from "../serializers/SerializeUtils";
import {getTimeString, getZonedTimeFromDateAndRegion} from "../time/timeZone";
import {LobbyFetchResult} from "./interfaces/LobbyFetchResult";
import {LobbyPlayer} from "./interfaces/LobbyPlayer";
import {LobbyTitleOptions, PostLobbyOptions,} from "./interfaces/PostLobbyOptions";
import {IRemainingTime} from "./interfaces/RemainingTime";
import {TeamsTableGenerator} from "./TeamTableGenerator";
import {UserTableGenerator} from "./UserTableGenerator";

const footerStringBeginner =
    "Join lobby by clicking 1️⃣, 2️⃣, ... at ingame positions you want.\nClick again to remove a position.\nRemove all positions to withdraw from the lobby.";

const footerStringTryout =
    "Join lobby by clicking ✅ below.\nClick again to withdraw.";

const footerStringMeeting =
    "Join meeting by clicking ✅ below.\nClick again to withdraw.";

const footerStringReplayAnalysis =
    "Join session by clicking ✅ below.\nClick again to withdraw.";

/**
 * Does all the work regarding updating / creating lobby posts in discord channels
 */
export class LobbyPostManipulator {
    public static async postLobby_deprecated(
        dbClient: DFZDataBaseClient,
        channel: TextBasedChannels,
        options: PostLobbyOptions
    ) {
        const lobby = new Lobby({
            date: options.time,
            type: options.type,
            guildId: options.guildId,
            beginnerRoleIds: options.userRoles,
            regionId: options.regionRole,
            coaches: options.coaches,
            channelId: channel.id,
        });
        const embed = LobbyPostManipulator.createLobbyEmbedding(lobby, options);
        await LobbyPostManipulator.postLobbyInt(channel, lobby, embed, dbClient);
    }

    public static async postLobby(client: DFZDiscordClient, lobby: Lobby) {
        const _embed = LobbyPostManipulator.createLobbyEmbedding(lobby);

        const channel = await ChannelManager.getChannel(
            client,
            lobby.channelId,
            lobby.guildId
        );
        await LobbyPostManipulator.postLobbyInt(
            channel,
            lobby,
            _embed,
            client.dbClient
        );
    }

    public static createLobbyEmbedding(lobby: Lobby, options?: PostLobbyOptions) {
        const title = this.createLobbyPostTitle(lobby, options);
        const text = LobbyPostManipulator.getLobbyPostText(
            lobby.beginnerRoleIds,
            lobby.type,
            lobby.regionId,
            lobby.coaches
        );
        const footer = this.getLobbyPostFooter(lobby.type, lobby.regionId);
        return EmbeddingCreator.create(title, text, footer);
    }

    public static async cancelLobbyPost(
        lobby: Lobby,
        channel: TextBasedChannels,
        reason: string = ""
    ) {
        await this.tryUpdateLobbyPostTitle(
            lobby.messageId,
            channel,
            "[⛔ Lobby cancelled! 😢]\n" +
            `${reason !== "" ? `Reason: ${reason}` : ""}`
        );
    }

    public static async tryUpdateLobbyPostTitle(
        messageId: string,
        channel: TextBasedChannels,
        titleUpdate: string,
        unpin = true
    ) {
        try {
            await this.updateLobbyPostTitle(messageId, channel, titleUpdate, unpin);
        } catch (e) {
            console.log(`Error in updateLobbyPostTitle:\n${e}`);
        }
    }

    public static writeLobbyStartPost(lobby: Lobby, channel: TextBasedChannels) {
        const playersPerLobby = getPlayersPerLobbyByLobbyType(lobby.type);
        this.createLobbyStartPost(lobby, channel, playersPerLobby);
    }

    /**
     *  Update lobby post to account for current lobby state
     *  @param lobby lobby state
     *  @param channel message channel
     */
    public static async tryUpdateLobbyPost(
        lobby: Lobby,
        channel: TextBasedChannels
    ) {
        try {
            await this.updateLobbyPost(lobby, channel);
        } catch (e) {
            console.log(`Error in updateLobbyPost: ${e}`);
        }
    }

    public static getLobbyPostText(
        lobbyUserRoles: string[],
        lobbyType: number,
        lobbyRegionRole: string,
        coaches: string[]
    ) {
        return (
            "for " +
            getRoleMentions(lobbyUserRoles) +
            this.getCoachMentions(lobbyType, coaches) +
            (isRoleBasedLobbyType(lobbyType)
                ? "\nRegion: " + roleMention(lobbyRegionRole)
                : "")
        );
    }

    public static async updateLobbyPostDescription(
        fetchResult: LobbyFetchResult,
        remainingTime: IRemainingTime
    ) {
        var description = this.pruneEmbedDescription(fetchResult.embed);
        this.updateDescriptionTime(
            description,
            remainingTime,
            remainingTime.totalMs > 0
        );

        var new_embed = new MessageEmbed(fetchResult.embed);
        new_embed.description = description.join("\n");

        await fetchResult.message.edit({embeds: [new_embed]});
    }

    private static async postLobbyInt(
        channel: TextBasedChannels,
        lobby: Lobby,
        embed: MessageEmbed,
        dbClient: DFZDataBaseClient
    ) {
        const lobbyPostMessage = await channel.send({
            content: getRoleMentions(lobby.beginnerRoleIds),
            embeds: [embed],
        });

        const remainingTime = lobby.calculateRemainingTime();

        await LobbyPostManipulator.updateLobbyPostDescription(
            {embed, message: lobbyPostMessage},
            remainingTime
        );
        lobbyPostMessage.pin();
        lobby.messageId = lobbyPostMessage.id;
        await createLobbyPostReactions(lobby.type, lobbyPostMessage);
        LobbyPostManipulator.createLobbyDataInDb(lobby, dbClient);

    }

    private static createLobbyDataInDb(
        lobby: Lobby,
        dbClient: DFZDataBaseClient
    ) {
        const gdbc = SerializeUtils.getGuildDBClient(lobby.guildId, dbClient);
        const serializer = new LobbySerializer(gdbc);
        serializer.insert(lobby);
    }

    private static createLobbyPostTitle(
        lobby: Lobby,
        options?: LobbyTitleOptions
    ) {
        if (options) {
            return this.createOptionsBasedLobbyPostTitle(options);
        }

        const titleStart = `We host ${getLobbyPostNameByType(lobby.type)} on `;

        const time = getZonedTimeFromDateAndRegion(lobby.date, lobby.regionId);
        const timeString = time
            ? getTimeString(time)
            : new Date(lobby.date.epoch).toUTCString();

        const titleEnd = LobbyPostManipulator.printOptionalText(lobby.text);
        return titleStart + timeString + titleEnd;
    }

    private static createOptionsBasedLobbyPostTitle(
        options: LobbyTitleOptions
    ): string {
        const titleStart = `We host ${getLobbyPostNameByType(options.type)} on `;
        const timeString = getTimeString(options.time);
        const titleEnd = LobbyPostManipulator.printOptionalText(
            options.optionalText
        );
        return titleStart + timeString + titleEnd;
    }

    private static printOptionalText(text: string | undefined) {
        return text ? "\nTopic: " + text : "";
    }

    private static getLobbyPostFooter(type: number, regionRole: string) {
        var res = "";
        if (isRoleBasedLobbyType(type)) {
            res += `${footerStringBeginner} \n\nPlayers from ${getRegionalRoleString(
                regionRole
            )}-region will be moved up.`;
        } else if (type === lobbyTypes.tryout) {
            res += footerStringTryout;
        } else if (type === lobbyTypes.meeting) {
            res += footerStringMeeting;
        } else if (type === lobbyTypes.replayAnalysis)
            res += footerStringReplayAnalysis;

        if (type === lobbyTypes.meeting) {
            res += "\n\nMeeting chair:";
        } else res += "\n\nCoaches:";
        res += " Lock and start lobby with 🔒, cancel with ❌";
        return res;
    }

    private static async updateLobbyPostTitle(
        messageId: string,
        channel: TextBasedChannels,
        titleUpdate: string,
        unpin: boolean = true
    ) {
        const message = await channel.messages.fetch(messageId);
        if (unpin) await message.unpin();
        const newEmbed = this.createEmbedWithNewTitle(message, titleUpdate);
        await message.edit({embeds: [newEmbed]});
    }

    private static createEmbedWithNewTitle(
        message: Message,
        titleUpdate: string
    ): MessageEmbed {
        const old_embed: MessageEmbed = message.embeds[0];
        var newEmbedTitle = titleUpdate + "\n~~" + old_embed.title + "~~";
        if (newEmbedTitle.length > 256) newEmbedTitle = newEmbedTitle.slice(0, 256);

        return new MessageEmbed(old_embed).setTitle(newEmbedTitle);
    }

    private static createLobbyStartPost(
        lobby: Lobby,
        channel: TextBasedChannels,
        playersPerLobby: number
    ) {
        var userSets: LobbyPlayer[][] = [];
        var userSet: LobbyPlayer[] = [];

        this.fillUserSets(lobby, playersPerLobby, userSets, userSet);

        if (userSets.length === 0 && userSet.length !== 0) {
            this.postIncompleteTeam(channel, lobby, userSet);
            return;
        }

        this.createAndPostCompleteTeams(channel, lobby, userSets);

        if (userSet.length > 0 && userSet.length < playersPerLobby) {
            this.postBench(channel, userSet);
        }
    }

    private static fillUserSets(
        lobby: Lobby,
        playersPerLobby: number,
        userSets: LobbyPlayer[][],
        userSet: LobbyPlayer[]
    ) {
        for (let i = 0; i < lobby.users.length; i++) {
            // add in batches of lobbyTypePlayerCount
            userSet.push(lobby.users[i]);

            if ((i + 1) % playersPerLobby === 0) {
                userSets.push(userSet);
                userSet = [];
            }
        }
    }

    private static postIncompleteTeam(
        channel: TextBasedChannels,
        lobby: Lobby,
        userSet: LobbyPlayer[]
    ) {
        const title = this.getIncompleteTeamPostTitle(lobby.type);
        const tableGenerator = new UserTableGenerator(userSet, lobby.type, true);
        const embed = EmbeddingCreator.create(
            title,
            "",
            "",
            tableGenerator.generate()
        );
        channel.send({embeds: [embed]});
    }

    private static createAndPostCompleteTeams(
        channel: TextBasedChannels,
        lobby: Lobby,
        userSets: LobbyPlayer[][]
    ) {
        var counter = 0;
        const embeds: MessageEmbed[] = [];
        userSets.forEach((us) => {
            var teams = createTeams(us, lobby.type);
            const tableGenerator = new TeamsTableGenerator(teams, lobby.type, true);
            var teamTable = tableGenerator.generate();

            const embed = EmbeddingCreator.create(
                this.getCompleteTeamPostTitle(lobby.type, ++counter),
                "",
                "",
                teamTable
            );
            embeds.push(embed);
        });

        channel.send({embeds: embeds});
    }

    private static postBench(channel: TextBasedChannels, userSet: LobbyPlayer[]) {
        const embed = EmbeddingCreator.create(
            "Today's bench",
            "",
            "",
            this.generateBenchTable(userSet)
        );
        channel.send({embeds: [embed]});
    }

    private static getIncompleteTeamPostTitle(type: number) {
        if (type === lobbyTypes.tryout) return "Tryout lobby starts now";
        if (type === lobbyTypes.replayAnalysis)
            return "Replay analysis session starts now";
        if (type === lobbyTypes.meeting) return "Meeting starts now";

        return "Not enough players for a lobby but we gotta get going anyway";
    }

    private static getCompleteTeamPostTitle(type: number, counter: number) {
        var res = getLobbyNameByType(type);
        if (type === lobbyTypes.replayAnalysis) res += " session starts now";
        else if (type === lobbyTypes.meeting) res += " starts now";
        else
            res +=
                " lobby #" + counter + (counter == 1 ? " starts now" : " starts later");

        return res;
    }

    private static generateBenchTable(userSet: LobbyPlayer[]) {
        const anyNumberOfPlayers = -1;
        const mentionPlayers = true;
        const tableGenerator = new UserTableGenerator(
            userSet,
            anyNumberOfPlayers,
            mentionPlayers
        );
        return tableGenerator.generate();
    }

    private static async updateLobbyPost(
        lobby: Lobby,
        channel: TextBasedChannels
    ) {
        const message = await channel.messages.fetch(lobby.messageId);
        var embed = LobbyPostManipulator.updateLobbyEmbed(message, lobby);
        await message.edit({
            content: getRoleMentions(lobby.beginnerRoleIds),
            embeds: [embed],
        });
    }

    private static updateLobbyEmbed(message: Message, lobby: Lobby) {
        var embed = new MessageEmbed(
            message.embeds.length > 0 ? message.embeds[0] : undefined
        );
        embed.title = this.updateLobbyTypeInPostTitle(lobby, embed);
        embed.description = this.getLobbyPostText(
            lobby.beginnerRoleIds,
            lobby.type,
            lobby.regionId,
            lobby.coaches
        );

        const remainingTime = lobby.calculateRemainingTime();
        const isPrior = remainingTime.totalMs > 0;
        this.updateDescriptionTime(embed.description, remainingTime, isPrior);

        const fields = lobby.getCurrentUsersAsTable(true);
        embed.fields = fields !== undefined ? fields : [];
        return embed;
    }

    private static updateLobbyTypeInPostTitle(lobby: Lobby, embed: MessageEmbed) {
        return (
            `We host ${getLobbyPostNameByType(lobby.type)} on ` +
            embed.title?.split(" on ")[1]
        );
    }

    private static getCoachMentions(
        lobbyType: number,
        coaches: string[]
    ): string {
        const maxCoachCount: number = getCoachCountByLobbyType(lobbyType);
        const coachCount: number = coaches === undefined ? 0 : coaches.length;
        if (coachCount === 0) return "";

        const isMeeting = lobbyType === lobbyTypes.meeting;
        const coachString = isMeeting ? "Chair" : "Coach";
        const coachStringPlural = isMeeting ? "Chairs" : "Coaches";
        return coachCount >= 2 && maxCoachCount === 2
            ? "\n" + `${coachStringPlural}: <@${coaches[0]}>, <@${coaches[1]}>`
            : "\n" + `${coachString}: <@${coaches[0]}>`;
    }

    private static updateDescriptionTime(
        description: string[] | string,
        remainingTime: IRemainingTime,
        isPrior: boolean
    ) {
        const addition = `${
            isPrior
                ? remainingLobbyTimeStartString
                : alreadyStartedLobbyTimeStartString
        }\
    ${remainingTime.hours > 0 ? `${remainingTime.hours}h ` : ""}\
    ${remainingTime.minutes}min ${isPrior ? "" : " ago"}`;

        typeof description === "string"
            ? (description += "\n" + addition)
            : description.push(addition);
    }

    private static pruneEmbedDescription(embed: MessageEmbed): string[] {
        var description = embed.description?.split("\n");
        if (description === undefined || description.length === 0) {
            return [];
        }

        const lastEntry = description[description.length - 1];
        if (
            lastEntry.startsWith(remainingLobbyTimeStartString) ||
            lastEntry.startsWith(alreadyStartedLobbyTimeStartString)
        )
            description.pop();

        return description;
    }
}


const remainingLobbyTimeStartString = "Time to lobby: ";
const alreadyStartedLobbyTimeStartString = "Lobby started ";
