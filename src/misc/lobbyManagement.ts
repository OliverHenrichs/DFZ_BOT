import {
  DMChannel,
  Guild,
  Message,
  MessageEmbed,
  MessageReaction,
  NewsChannel,
  TextChannel,
  User,
} from "discord.js";
import { Pool } from "mysql2/promise";
import { DFZDiscordClient } from "./types/DFZDiscordClient";
import { FieldElement } from "./interfaces/EmbedInterface";
import { LobbyPlayer } from "./interfaces/LobbyInterfaces";
import { getTimeString, Time } from "./timeZone";
import { Lobby } from "./types/lobby";
import {
  getLobbyNameByType,
  getLobbyPostNameByType,
  getLobbyTypeByString,
  getReactionEmojiPosition,
  isRoleBasedLobbyType,
  isSimpleLobbyType,
  lobbyTypeKeys,
  lobbyTypePlayerCount,
  lobbyTypes,
  tryoutReactionEmoji,
} from "./constants";
import { updateLobby, getLobbies, insertLobby, removeLobby } from "./database";
import { generateEmbedding } from "./answerEmbedding";
import {
  getRoleMentions,
  getRoleMention,
  getRegionalRoleString,
  getBeginnerRolesFromNumbers,
  getRegionalRoleFromString,
} from "./roleManagement";
import { createTeams, getUser } from "./userHelper";
import { createLobbyPostReactions } from "./messageHelper";
import { getNumbersFromString } from "./generics";
import { saveCoachParticipation, savePlayerParticipation } from "./tracker";
import { getLobbyChannelFromGuildManager } from "./channelManagement";

/**
 * Returns required number of coaches for a given lobby type
 * @param {number} lobbyType given lobby type
 * @return {number}
 */
function getCoachCountByLobbyType(lobbyType: number) {
  switch (lobbyType) {
    case lobbyTypes.inhouse:
      return 2;
    case lobbyTypes.unranked:
      return 1;
    case lobbyTypes.botbash:
      return 1;
    case lobbyTypes.tryout:
      return 1;
    case lobbyTypes.replayAnalysis:
      return 1;
    case lobbyTypes.meeting:
      return 1;
  }
  return 0;
}

function addUserNameToUserTable(
  tableBase: Array<FieldElement>,
  user: LobbyPlayer,
  startIndex = 0,
  mention = false
) {
  tableBase[startIndex].value = `${tableBase[startIndex].value}\r\n${
    user.region.name !== "" ? `[${user.region.name}]` : ""
  }${mention ? `<@${user.id}>` : user.name}`;
}

function addUserPositionsToUserTable(
  tableBase: Array<FieldElement>,
  positions: Array<number>,
  startIndex = 0
) {
  tableBase[startIndex + 1].value = `${tableBase[startIndex + 1].value}
${positions.length === 1 && positions[0] === -1 ? "-" : positions.join(", ")}`;
}

function addTierToUserTable(
  tableBase: Array<FieldElement>,
  user: LobbyPlayer,
  startIndex = 0
) {
  tableBase[startIndex + 2].value = `${tableBase[startIndex + 2].value}
${user.tier.name}`;
}

function addUserWithPositionsToUserTable(
  tableBase: Array<FieldElement>,
  user: LobbyPlayer,
  positions: Array<number>,
  startIndex = 0,
  mention = false
) {
  addUserNameToUserTable(tableBase, user, startIndex, mention);

  addUserPositionsToUserTable(tableBase, positions, startIndex);

  addTierToUserTable(tableBase, user);
}

/**
 *  adds user + position + tier to table
 *  @param tableBase table to which data is added
 *  @param user user to add
 *  @param mention if true mentions the user in the table
 */
function addToUserTable(
  tableBase: Array<FieldElement>,
  user: LobbyPlayer,
  startIndex = 0,
  mention = false
) {
  addUserWithPositionsToUserTable(
    tableBase,
    user,
    user.positions,
    startIndex,
    mention
  );
}

function createUserTableBase(): Array<FieldElement> {
  return [
    {
      name: "Name",
      value: "",
      inline: true,
    },
    {
      name: "Position",
      value: "",
      inline: true,
    },
    {
      name: "Tier",
      value: "",
      inline: true,
    },
  ];
}

function createUserTableBench(): Array<FieldElement> {
  return [
    {
      name: "Bench",
      value: "If people leave, you get pushed up",
      inline: false,
    },
  ].concat(createUserTableBase());
}

/**
 *  returns a table of users
 *  @param tableBase table to which data is added
 *  @param users array of users
 *  @param playersPerLobby how many players fit in the lobby? rest is bench; value of -1 will allow any number
 *  @param mention if true mentions the users in the table
 */
function getUserTable(
  users: LobbyPlayer[],
  playersPerLobby = anyNumberOfPlayers,
  mention = false
) {
  if (users.length == 0) {
    return undefined;
  }

  var tableBase = createUserTableBase();
  var tableBench = createUserTableBench();

  var tableStartIndexPlayers = 0;
  var tableStartIndexBench = 1;

  var userIndex = 0;
  users.forEach((usr) => {
    if (userIndex++ < playersPerLobby || playersPerLobby === anyNumberOfPlayers)
      addToUserTable(tableBase, usr, tableStartIndexPlayers, mention);
    else addToUserTable(tableBench, usr, tableStartIndexBench, mention);
  });

  if (userIndex > playersPerLobby && playersPerLobby !== anyNumberOfPlayers) {
    var finalTable = tableBase.concat(tableBench);
    return finalTable;
  }

  return tableBase;
}

const anyNumberOfPlayers = -1;
function getPlayersPerLobbyByLobbyType(type: number) {
  var lobbyTypeKey = (
    Object.keys(lobbyTypes) as Array<keyof typeof lobbyTypes>
  ).find((typeKey) => lobbyTypes[typeKey] === type);
  if (lobbyTypeKey) return lobbyTypePlayerCount[lobbyTypeKey];

  return anyNumberOfPlayers; // just something reasonable...
}

function getCurrentUsersAsTable(lobby: Lobby, mention = false) {
  const playersPerLobby = getPlayersPerLobbyByLobbyType(lobby.type);
  return getUserTable(lobby.users, playersPerLobby, mention);
}

/**
 *  adds user + position + tier to team table
 *  @param tableBase table to which data is added
 *  @param index table index at which data is added
 *  @param player user to add
 *  @param position position of user to add
 *  @param mention if true mentions the user in the table
 */
function addUserToTeam(
  tableBase: Array<FieldElement>,
  index: number,
  player: LobbyPlayer,
  position: number,
  mention: boolean
) {
  addUserWithPositionsToUserTable(
    tableBase,
    player,
    [position],
    index,
    mention
  );
}

/**
 *  Creates a table for a match given assigned users
 *  @param assignedUsers field where for each position players are assigned
 *  @param lobbyType type of lobby to determine table shape
 *  @param mention if true mentions the users in the table
 */
function getTeamTable(
  assignedUsers: LobbyPlayer[][],
  lobbyType: number,
  mention = false
) {
  if (lobbyType == lobbyTypes.inhouse) {
    var tableBaseInhouse = [
      {
        name: "Side",
        value: "Radiant",
        inline: false,
      },
      {
        name: "Name",
        value: "",
        inline: true,
      },
      {
        name: "Position",
        value: "",
        inline: true,
      },
      {
        name: "Tier",
        value: "",
        inline: true,
      },
      {
        name: "Side",
        value: "Dire",
        inline: false,
      },
      {
        name: "Name",
        value: "",
        inline: true,
      },
      {
        name: "Position",
        value: "",
        inline: true,
      },
      {
        name: "Tier",
        value: "",
        inline: true,
      },
    ];
    for (let pos = 0; pos < 5; pos++) {
      // 5 players/positions per team
      var players = assignedUsers[pos]; // 2 players per position assured by being full team inhouse 5v5
      const teamAIndex = 1;
      const teamBIndex = 5;
      addUserToTeam(tableBaseInhouse, teamAIndex, players[0], pos + 1, mention);
      addUserToTeam(tableBaseInhouse, teamBIndex, players[1], pos + 1, mention);
    }

    return tableBaseInhouse;
  } else if (
    lobbyType == lobbyTypes.unranked ||
    lobbyType == lobbyTypes.botbash ||
    lobbyType == lobbyTypes.tryout
  ) {
    var tableBase = [
      {
        name: "Name",
        value: "",
        inline: true,
      },
      {
        name: "Position",
        value: "",
        inline: true,
      },
      {
        name: "Tier",
        value: "",
        inline: true,
      },
    ];

    const teamIndex = 0;
    for (let pos = 0; pos < 5; pos++) {
      // 5 players/positions
      var players = assignedUsers[pos]; // 1 player per position assured by being full team inhouse 5v5
      addUserToTeam(tableBase, teamIndex, players[0], pos + 1, mention);
    }

    return tableBase;
  }

  return [];
}

/**
 * Updates message embedding to fit new title / pin status
 * @param {string} messageId message ID of the message that we want to change
 * @param {Discord.Channel} channel the message's channel
 * @param {string} titleUpdate new title
 * @param {boolean} unpin true to unpin message
 */
async function updateAndUnpinLobbyEmbedding(
  messageId: string,
  channel: TextChannel | NewsChannel,
  titleUpdate: string,
  unpin = true
) {
  // fetch message
  try {
    const message = await channel.messages.fetch(messageId);
    if (unpin === true) message.unpin();

    // generate new embed
    const old_embed: MessageEmbed = message.embeds[0];
    var newEmbedTitle = titleUpdate + "\n~~" + old_embed.title + "~~";
    if (newEmbedTitle.length > 256) newEmbedTitle = newEmbedTitle.slice(0, 256);

    var new_embed: MessageEmbed = new MessageEmbed(old_embed).setTitle(
      newEmbedTitle
    );

    // update embed
    message.edit(new_embed);
  } catch (e) {
    console.log(`Error in updateAndUnpinLobbyEmbedding:\n${e}`);
  }
}

function getIncompleteTeamPostTitle(type: number) {
  if (type === lobbyTypes.tryout) return "Tryout lobby starts now";
  if (type === lobbyTypes.replayAnalysis)
    return "Replay analysis session starts now";
  if (type === lobbyTypes.meeting) return "Meeting starts now";

  return "Not enough players for a lobby but we gotta get going anyway";
}

function getCompleteTeamPostTitle(type: number, counter: number) {
  var res = getLobbyNameByType(type);
  if (type === lobbyTypes.replayAnalysis) res += " session starts now";
  else if (type === lobbyTypes.meeting) res += " starts now";
  else
    res +=
      " lobby #" + counter + (counter == 1 ? " starts now" : " starts later");

  return res;
}

function fillUserSets(
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

function postIncompleteTeam(
  channel: TextChannel | NewsChannel,
  lobby: Lobby,
  playersPerLobby: number,
  userSet: LobbyPlayer[]
) {
  var title = getIncompleteTeamPostTitle(lobby.type);
  const _embed = generateEmbedding(
    title,
    "",
    "",
    getUserTable(userSet, playersPerLobby, true)
  );
  channel.send({ embed: _embed });
}

function postCompleteTeams(
  channel: TextChannel | NewsChannel,
  lobby: Lobby,
  userSets: LobbyPlayer[][]
) {
  var counter = 0;
  userSets.forEach((us) => {
    var teams = createTeams(us, lobby.type);
    var teamTable = getTeamTable(teams, lobby.type, true);

    const _embed = generateEmbedding(
      getCompleteTeamPostTitle(lobby.type, ++counter),
      "",
      "",
      teamTable
    );
    channel.send({ embed: _embed });
  });
}

function postBench(channel: TextChannel | NewsChannel, userSet: LobbyPlayer[]) {
  // bench
  const _embed = generateEmbedding(
    "Today's bench",
    "",
    "",
    getUserTable(userSet, -1, true)
  );
  channel.send({ embed: _embed });
}

/**
 *  Creates an embedding for a starting lobby
 *  @param lobby lobby to start
 *  @param channel channel in which lobby resides
 *  @param playersPerLobby how many players per lobby (will create multiple lobbies if e. more than 2x the neccessary players showed up. Rest go to bench).
 */
function createLobbyStartPost(
  lobby: Lobby,
  channel: TextChannel | NewsChannel,
  playersPerLobby: number
) {
  var userSets: LobbyPlayer[][] = [];
  var userSet: LobbyPlayer[] = [];

  fillUserSets(lobby, playersPerLobby, userSets, userSet);

  if (userSets.length === 0 && userSet.length !== 0) {
    postIncompleteTeam(channel, lobby, playersPerLobby, userSet);
    return;
  }

  postCompleteTeams(channel, lobby, userSets);

  if (userSet.length > 0 && userSet.length < playersPerLobby) {
    postBench(channel, userSet);
  }
}

async function updateLobbyPostAndDBEntry(
  lobby: Lobby,
  channel: TextChannel | NewsChannel | DMChannel,
  dbHandle: Pool
) {
  module.exports
    .updateLobbyPost(lobby, channel) // update lobby post
    .then(() => updateLobby(dbHandle, lobby)) // update lobby in backend
    .catch((err: string) =>
      console.log(
        "Could not update lobby in post or data base. Reason: \n" + err
      )
    );
}

/**
 * Notify all players of a lobby
 * @param {DFZDiscordClient} client discord client
 * @param {Lobby} lobby lobby containing the player to notify
 * @param {string} message message to send to players
 */
function notifyPlayers(
  client: DFZDiscordClient,
  lobby: Lobby,
  playerCount: number,
  message: string
) {
  for (let i = 0; i < Math.min(lobby.users.length, playerCount); i++) {
    client.users
      .fetch(lobby.users[i].id)
      .then((user) => {
        if (user !== undefined) user.send(message);
      })
      .catch((err) =>
        console.log("Error notifying players. Errormessage: " + err)
      );
  }
}

function getLobbyPostText(
  lobbyUserRoles: string[],
  lobbyType: number,
  lobbyRegionRole: string,
  coaches: string[]
) {
  const maxCoachCount: number = getCoachCountByLobbyType(lobbyType);
  const coachCount: number = coaches === undefined ? 0 : coaches.length;
  var coachString = "";
  var coachStringPl = "";
  if (lobbyType === lobbyTypes.meeting) {
    coachString = "Chair";
    coachStringPl = "Chairs";
  } else {
    coachString = "Coach";
    coachStringPl = "Coaches";
  }
  return (
    "for " +
    getRoleMentions(lobbyUserRoles) +
    (coachCount === 0
      ? ""
      : coachCount >= 2 && maxCoachCount === 2
      ? "\n" + coachStringPl + ": <@" + coaches[0] + ">, <@" + coaches[1] + ">"
      : "\n" + coachString + ": <@" + coaches[0] + ">") +
    (isRoleBasedLobbyType(lobbyType)
      ? "\nRegion: " + getRoleMention(lobbyRegionRole)
      : "")
  );
}

async function getMessageFromChannel(
  channel: TextChannel | NewsChannel,
  messageId: string
) {
  return new Promise<Message | undefined>(function (resolve, reject) {
    channel.messages
      .fetch(messageId)
      .then((message) => {
        resolve(message);
      })
      .catch((err) => resolve(undefined));
  });
}

function getLobbyPostFooter(type: number, regionRole: string) {
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

const remainingLobbyTimeStartString = "Time to lobby: ";
const alreadyStartedLobbyTimeStartString = "Lobby started ";
var footerStringBeginner =
  "Join lobby by clicking 1️⃣, 2️⃣, ... at ingame positions you want.\nClick again to remove a position.\nRemove all positions to withdraw from the lobby.";
var footerStringTryout =
  "Join lobby by clicking ✅ below.\nClick again to withdraw.";
var footerStringReplayAnalysis =
  "Join session by clicking ✅ below.\nClick again to withdraw.";
var footerStringMeeting =
  "Join meeting by clicking ✅ below.\nClick again to withdraw.";

/**
 *  Finds lobby by its channel and message
 *  @return undefined if not found, else returns the lobby
 *  @param dbHandle bot database handle
 *  @param channelId message channel id
 *  @param messageId message ID
 */
export async function findLobbyByMessage(
  dbHandle: Pool,
  channelId: string,
  messageId: string
) {
  var lobbies = await getLobbies(dbHandle, channelId, messageId);
  if (lobbies.length !== 1) return undefined;

  return lobbies[0];
}

export interface PostLobbyOptions {
  type: number;
  regionRole: string;
  userRoles: string[];
  time: Time;
  coaches: string[];
  optionalText: string;
}

export async function postLobby(
  dbHandle: Pool,
  channel: TextChannel | NewsChannel | DMChannel,
  options: PostLobbyOptions
) {
  var title = `We host ${getLobbyPostNameByType(
    options.type
  )} on ${getTimeString(options.time)} ${
    options.time.zone ? options.time.zone.abbreviation : ""
  }${options.optionalText !== "" ? "\nTopic: " + options.optionalText : ""}`;
  var text = getLobbyPostText(
    options.userRoles,
    options.type,
    options.regionRole,
    options.coaches
  );
  var footer = getLobbyPostFooter(options.type, options.regionRole);

  // send embedding post to lobby signup-channel
  const _embed = generateEmbedding(title, text, footer);
  const lobbyPostMessage = await channel.send(
    getRoleMentions(options.userRoles),
    { embed: _embed }
  ); // mentioning roles in message again to ping beginners

  // pin message to channel
  lobbyPostMessage.pin();

  // add emojis
  createLobbyPostReactions(options.type, lobbyPostMessage);

  // create lobby data in database
  insertLobby(
    dbHandle,
    new Lobby(
      options.type,
      options.time.epoch,
      options.coaches,
      options.userRoles,
      options.regionRole,
      channel.id,
      lobbyPostMessage.id
    )
  );
}

function getLobbyPostTitle(lobby: Lobby, embed: MessageEmbed) {
  return (
    `We host ${getLobbyPostNameByType(lobby.type)} on ` +
    embed.title?.split(" on ")[1]
  );
}

/**
 *  Update lobby post to account for current lobby state
 *  @param lobby lobby state
 *  @param channel message channel
 */
export async function updateLobbyPost(
  lobby: Lobby,
  channel: TextChannel | DMChannel | NewsChannel
) {
  try {
    const message = await channel.messages.fetch(lobby.messageId);

    var embed = new MessageEmbed(
      message.embeds.length > 0 ? message.embeds[0] : undefined
    );

    embed.title = getLobbyPostTitle(lobby, embed);

    embed.description = getLobbyPostText(
      lobby.beginnerRoleIds,
      lobby.type,
      lobby.regionId,
      lobby.coaches
    );

    const remainingTime = calculateRemainingTime(lobby);
    const isPrior = remainingTime.totalMs > 0;
    updateDescriptionTime(embed.description, remainingTime, isPrior);

    const fields = getCurrentUsersAsTable(lobby, true);
    embed.fields = fields !== undefined ? fields : [];

    await message.edit(embed);
  } catch (e) {
    console.log(`Error in updateLobbyPost: ${e}`);
  }
}

interface LobbyFetchResult {
  message: Message;
  embed: MessageEmbed;
}

async function fetchLobbyFromDiscord(
  lobby: Lobby,
  channel: TextChannel | NewsChannel
): Promise<LobbyFetchResult | undefined> {
  const message = await getMessageFromChannel(channel, lobby.messageId);
  if (message === undefined) {
    return undefined;
  }

  const old_embed: MessageEmbed = message.embeds[0];
  if (old_embed === undefined) {
    return undefined;
  }

  return { message: message, embed: old_embed };
}

interface RemainingTime {
  totalMs: number;
  minutes: number;
  hours: number;
}

const msToMinutes = 1 / (1000 * 60);
const msToHours = msToMinutes / 60;

function calculateRemainingTime(lobby: Lobby): RemainingTime {
  var res = {
    totalMs: lobby.date - Date.now(),
    minutes: -1,
    hours: -1,
  };
  if (res.totalMs > 0) {
    res.minutes = Math.floor((res.totalMs * msToMinutes) % 60);
    res.hours = Math.floor(res.totalMs * msToHours);
  } else {
    res.minutes = Math.floor((-res.totalMs * msToMinutes) % 60);
    res.hours = Math.floor(-res.totalMs * msToHours);
  }

  return res;
}

function pruneEmbedDescription(embed: MessageEmbed): string[] {
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

function updateDescriptionTime(
  description: string[] | string,
  remainingTime: RemainingTime,
  isPrior: boolean
) {
  const addition = `${
    isPrior ? remainingLobbyTimeStartString : alreadyStartedLobbyTimeStartString
  }\
    ${remainingTime.hours > 0 ? `${remainingTime.hours}h ` : ""}\
    ${remainingTime.minutes}min ${isPrior ? "" : " ago"}`;

  typeof description === "string"
    ? (description += "\n" + addition)
    : description.push(addition);
}

async function cancelDeprecatedLobby(
  lobby: Lobby,
  channel: TextChannel | NewsChannel,
  dbHandle: Pool
) {
  await cancelLobbyPost(
    lobby,
    channel,
    "Lobby is deprecated. Did the coach not show up? Pitchforks out! 😾"
  );
  await removeLobby(dbHandle, lobby);
}

/**
 *  Update each lobby post and prune deleted and deprecated lobbies
 *  @param dbHandle handle to data base
 *  @param channels the bot's message channels on the server
 */
export async function updateLobbyPosts(guild: Guild, dbHandle: Pool) {
  var lobbies: Lobby[] = await getLobbies(dbHandle);

  var channels = guild.channels;

  for (const lobby of lobbies) {
    const channel = getLobbyChannelFromGuildManager(lobby, channels);
    if (!channel) continue;

    const lobbyFetchResult = await fetchLobbyFromDiscord(lobby, channel);
    if (!lobbyFetchResult) {
      // remove if e.g. an admin deleted the message
      await removeLobby(dbHandle, lobby);
      continue;
    }

    const remainingTime = calculateRemainingTime(lobby);
    if (remainingTime.totalMs < 0 && remainingTime.hours >= 3) {
      cancelDeprecatedLobby(lobby, channel, dbHandle);
      continue;
    }

    if (lobby.started) continue;

    var description = pruneEmbedDescription(lobbyFetchResult.embed);
    updateDescriptionTime(
      description,
      remainingTime,
      remainingTime.totalMs > 0
    );

    // generate new embed
    var new_embed = new MessageEmbed(lobbyFetchResult.embed);
    new_embed.description = description.join("\n");

    // update embed
    await lobbyFetchResult.message.edit(new_embed);
  }
}

/**
 *  Update lobby post to account for cancellation of lobby
 *  @param lobby lobby
 *  @param channel message channel
 */
export async function cancelLobbyPost(
  lobby: Lobby,
  channel: TextChannel | NewsChannel,
  reason: string = ""
) {
  updateAndUnpinLobbyEmbedding(
    lobby.messageId,
    channel,
    "[⛔ Lobby cancelled! 😢]\n" + `${reason !== "" ? `Reason: ${reason}` : ""}`
  );
}

const fiveMinInMs = 300000;
function testLobbyStartTime(lobby: Lobby, user: User): boolean {
  // prevent premature start of lobby
  var timeLeftInMS = lobby.date - +new Date();
  if (timeLeftInMS > fiveMinInMs) {
    // 5min = 300.000 ms
    user.send(
      "It's not time to start the lobby yet (" +
        Math.floor((timeLeftInMS - fiveMinInMs) / 60000) +
        " min to go)."
    );
    return false;
  }

  return true;
}

export async function deleteLobbyAfterStart(
  lobby: Lobby,
  client: DFZDiscordClient
) {
  await savePlayerParticipation(
    client,
    lobby.users,
    lobby.type,
    getPlayersPerLobbyByLobbyType(lobby.type)
  );
  await removeLobby(client.dbHandle, lobby);
}

export function writeLobbyStartPost(
  lobby: Lobby,
  channel: TextChannel | NewsChannel
) {
  const playersPerLobby = getPlayersPerLobbyByLobbyType(lobby.type);
  createLobbyStartPost(lobby, channel, playersPerLobby);
}

/**
 * Starts lobby if time is up
 * @param {Discord.Client} client discord client
 * @param {JSON} lobby lobby to start
 * @param {Discord.User} user user who wants to start the lobby
 * @param {Discord.Channel} channel channel in which the lobby resides
 * @return true if lobby was started (and can therefore be removed)
 */
export async function startLobby(
  client: DFZDiscordClient,
  lobby: Lobby,
  user: User,
  channel: TextChannel | NewsChannel
) {
  if (!testLobbyStartTime(lobby, user)) return false;

  // check player count
  if (lobby.users.length === 0) {
    cancelLobbyPost(lobby, channel, "Nobody showed up!");
    user.send(
      "🔒 I started the lobby. Nobody signed up tho, so just play some Dotes instead 😎"
    );
    return true;
  }

  writeLobbyStartPost(lobby, channel);

  const playersPerLobby = getPlayersPerLobbyByLobbyType(lobby.type);
  notifyPlayers(
    client,
    lobby,
    playersPerLobby,
    `Your ${getLobbyNameByType(
      lobby.type
    )}-lobby just started! 😎 Please move to the voice channel and await further instructions.`
  );
  // notify coach
  user.send("🔒 I started the lobby.");

  // delete the lobby and "archive" the lobby post
  updateAndUnpinLobbyEmbedding(
    lobby.messageId,
    channel,
    "[⛔ Lobby started already! 😎]"
  );

  saveCoachParticipation(client.dbHandle, lobby.coaches, lobby.type);

  lobby.started = true;
  await updateLobby(client.dbHandle, lobby);

  return true;
}

/**
 * manages removal of reaction in lobby post (position removal or player removal if last position)
 * @param {Pool} dbHandle
 * @param {MessageReaction} reaction reaction that was removed
 * @param {Lobby} lobby lobby that we look at
 * @param {User} user user who removed the reaction
 */
export async function updatePlayerInLobby(
  dbHandle: Pool,
  reaction: MessageReaction,
  lobby: Lobby,
  user: User
) {
  // check reaction emojis
  var position = -1;

  // for simple lobbies just check '✅'
  if (isSimpleLobbyType(lobby.type)) {
    if (reaction.emoji.name !== tryoutReactionEmoji) return;
  } else {
    // for role based lobbies check positions
    position = getReactionEmojiPosition(reaction.emoji);
    if (position === 0)
      // if finds none => -1, but function adds one to match with ingame positions 1-5; therefore 0 = -1...
      return;
  }

  // check if lobby contains user
  var lobbyUser: LobbyPlayer | undefined = getUser(lobby, user.id);
  if (lobbyUser === undefined) return;

  // for simple lobbies, always remove
  var removeUser = true;

  // if positions are relevant, remove positions
  if (isRoleBasedLobbyType(lobby.type)) {
    // remove user position
    lobbyUser.positions = lobbyUser.positions.filter((_position) => {
      return _position != position;
    });

    // do not remove user if some positions are left
    if (lobbyUser.positions.length !== 0) removeUser = false;
  }

  // remove user if necessary
  if (removeUser === true) {
    var idx = lobby.users.findIndex((_user) => _user.id == user.id);
    lobby.users.splice(idx, 1);
  }

  await updateLobbyPostAndDBEntry(lobby, reaction.message.channel, dbHandle);
}

/**
 * Adds coach to existing lobby
 * @param {Pool} dbHandle
 * @param {Channel} channel
 * @param {Lobby} lobby
 * @param {string} userId
 * @returns true if successful, false if not
 */
export async function addCoach(
  dbHandle: Pool,
  channel: TextChannel | NewsChannel,
  lobby: Lobby,
  userId: string
) {
  return new Promise<boolean>(function (resolve, reject) {
    if (lobby.coaches === undefined) {
      reject("Lobby does not support coaches.");
      return;
    }

    const coachCount = getCoachCountByLobbyType(lobby.type);
    if (lobby.coaches.length >= coachCount) {
      reject("Enough coaches have already signed up.");
      return;
    }

    if (lobby.coaches.find((coach) => coach === userId) !== undefined) {
      reject("You are already signed up as a coach.");
      return;
    }

    lobby.coaches.push(userId);

    updateLobbyPostAndDBEntry(lobby, channel, dbHandle).then(() =>
      resolve(true)
    );
  });
}

/**
 * Removes coach from existing lobby
 * @param {Pool} dbHandle
 * @param {TextChannel} channel
 * @param {Lobby} lobby
 * @param {string} userId
 * @returns true if successful, false if not
 */
export async function removeCoach(
  dbHandle: Pool,
  channel: TextChannel | NewsChannel,
  lobby: Lobby,
  userId: string
) {
  return new Promise<boolean>(function (resolve, reject) {
    const coachIndex = lobby.coaches.findIndex((coach) => coach === userId);
    if (coachIndex === -1) {
      reject("You are not signed up as a coach.");
      return;
    }
    lobby.coaches.splice(coachIndex, 1);

    updateLobbyPostAndDBEntry(lobby, channel, dbHandle).then(() =>
      resolve(true)
    );
  });
}
