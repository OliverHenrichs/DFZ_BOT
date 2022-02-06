import {GuildMember, Message} from "discord.js";
import {DFZDataBaseClient} from "../logic/database/DFZDataBaseClient";
import {
  adminRoles,
  beginnerRoles,
  companionRole,
  findRole,
  getBeginnerRolesFromNumbers,
} from "../logic/discord/roleManagement";
import {PostLobbyOptions} from "../logic/lobby/interfaces/PostLobbyOptions";
import {LobbyPostManipulator} from "../logic/lobby/LobbyPostManipulator";
import {ITime} from "../logic/time/interfaces/Time";
import {isRoleBasedLobbyType, isSimpleLobbyType, lobbyTypes,} from "../misc/constants";
import {
  getArguments,
  getLobbyRegionRoleFromMessage,
  getLobbyTypeFromMessage,
  getNumbersFromMessage,
  getTimeFromMessage,
  reactNegative,
  reactPositive,
} from "../misc/messageHelper";

/**
 * Checks if lobby exists and posts lobby post depending on lobby type
 */
export default async (message: Message, dbClient: DFZDataBaseClient) => {
    await tryPostLobby(message, dbClient);
};

async function tryPostLobby(
    message: Message,
    dbClient: DFZDataBaseClient
): Promise<void> {
    try {
        const options = tryGetLobbyOptionsFromMessage(message);
        await LobbyPostManipulator.postLobby_deprecated(
            dbClient,
            message.channel,
            options
        );
        await reactPositive({message, deleteMessage: true, reply: ""});
    } catch (e) {
        await reactNegative({message, deleteMessage: true, reply: e as string});
    }
}

export function tryGetLobbyOptionsFromMessage(
    message: Message
): PostLobbyOptions {
    const type = getLobbyTypeFromMessage(message);

    if (!message.member || !isTypeAllowedForMember(type, message.member))
        throw new Error("You are not allowed to post this kind of lobby");

    return getLobbyOptions(message, type);
}

function isTypeAllowedForMember(type: number, member: GuildMember): boolean {
    // only allow companions to host meeting lobbies
    return !(findRole(member, [companionRole]) && type !== lobbyTypes.meeting);
}

function getLobbyTypeBasedTimeIndex(lobbyType: number): number {
    const simpleLobbyIndex = 1;
    const roleBasedLobbyIndex = 3;
    return isSimpleLobbyType(lobbyType) ? simpleLobbyIndex : roleBasedLobbyIndex;
}

function getLobbyOptions(message: Message, type: number): PostLobbyOptions {
    if (isRoleBasedLobbyType(type)) {
        return getRoleBasedLobbyOptions(message, type);
    } else {
        return getNonRoleBasedLobbyOptions(message, type);
    }
}

function getRoleBasedLobbyOptions(
    message: Message,
    type: number
): PostLobbyOptions {
    if (!message.guildId) {
        throw new Error("Message was not posted in guild");
    }
    return {
        guildId: message.guildId,
        type: type,
        regionRole: getLobbyRegionRole(message),
        userRoles: getAllowedTiers(message),
        time: getLobbyTime(message, type),
        coaches: [message.author.id],
        optionalText: "",
    };
}

function getLobbyRegionRole(message: Message): string {
    const argIndex = 1;
    return getLobbyRegionRoleFromMessage(message, argIndex);
}

function getAllowedTiers(message: Message): string[] {
    const rolesIdxInMessage = 2;
    const minRole = 0;
    const maxRole = 4;
    const numbers = getNumbersFromMessage(
        message,
        rolesIdxInMessage,
        minRole,
        maxRole
    );
    return getBeginnerRolesFromNumbers(numbers);
}

function getLobbyTime(message: Message, type: number): ITime {
    const lobbyIndex = getLobbyTypeBasedTimeIndex(type);
    const timeResult = getTimeFromMessage(message, lobbyIndex);
    return timeResult.time;
}

function getNonRoleBasedLobbyOptions(
    message: Message,
    type: number
): PostLobbyOptions {
    if (!message.guildId) {
        throw new Error("Message was not posted in guild");
    }
    const options: PostLobbyOptions = {
        guildId: message.guildId,
        type: type,
        regionRole: "",
        userRoles: [],
        time: getLobbyTime(message, type),
        coaches: [message.author.id],
        optionalText: "",
    };

    switch (options.type) {
        case lobbyTypes.replayAnalysis:
            setReplayAnalysisOptions(options);
            break;
        case lobbyTypes.tryout:
            setTryoutOptions(options);
            break;
        case lobbyTypes.meeting:
            setMeetingOptions(message, options);
            break;
        default:
            options.userRoles = beginnerRoles.concat(adminRoles);
    }

    return options;
}

function setReplayAnalysisOptions(options: PostLobbyOptions): void {
    options.userRoles = beginnerRoles;
}

function setTryoutOptions(options: PostLobbyOptions): void {
    const tryoutRoleNumber = 5;
    options.userRoles = getBeginnerRolesFromNumbers(new Set([tryoutRoleNumber]));
}

function setMeetingOptions(message: Message, options: PostLobbyOptions): void {
    const args = getArguments(message);
    setAllowedUserRoles(args, options);
    trySetOptionalText(args, options);
}

function setAllowedUserRoles(args: string[], options: PostLobbyOptions): void {
    options.userRoles = beginnerRoles.concat(adminRoles);

    const inviteeIndex = 3;
    if (args.length > inviteeIndex)
        trySetMeetingForPlayersOrCoaches(args[inviteeIndex], options);
}

function trySetMeetingForPlayersOrCoaches(
    inviteeString: string,
    options: PostLobbyOptions
): void {
    if (inviteeString === "coaches") options.userRoles = adminRoles;
    else if (inviteeString === "players") options.userRoles = beginnerRoles;
}

function trySetOptionalText(args: string[], options: PostLobbyOptions) {
    let optionalTextFrom = 4;
    if (options.userRoles.length === beginnerRoles.length + adminRoles.length)
        optionalTextFrom = 3;
    if (args.length > optionalTextFrom)
        options.optionalText = args.slice(optionalTextFrom).join(" ");
}
