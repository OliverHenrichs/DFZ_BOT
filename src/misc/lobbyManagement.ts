import {
  DMChannel,
  Guild,
  GuildChannel,
  Message,
  MessageEmbed,
  MessageReaction,
  NewsChannel,
  TextChannel,
  User,
} from "discord.js";
import Pool from "mysql2/typings/mysql/lib/Pool";
import { DFZDiscordClient } from "./interfaces/DFZDiscordClient";
import { FieldElement } from "./interfaces/EmbedInterface";
import { LobbyPlayer } from "./interfaces/LobbyInterfaces";
import { Time } from "./timeZone";
import { Lobby } from "./types/lobby";

const aE = require("./answerEmbedding");
const c = require("./constants");
const dB = require("./database");
const Discord = require("discord.js");
const g = require("./generics");
const l = require("./types/lobby");
const mH = require("./messageHelper");
const uH = require("./userHelper");
const rM = require("./roleManagement");
const tr = require("./tracker");
const tZ = require("./timeZone");
const fiveMinInMs = 300000;

/**
 * Returns required number of coaches for a given lobby type
 * @param {number} lobbyType given lobby type
 * @return {number}
 */
function getCoachCountByLobbyType(lobbyType: number) {
  switch (lobbyType) {
    case c.lobbyTypes.inhouse:
      return 2;
    case c.lobbyTypes.unranked:
      return 1;
    case c.lobbyTypes.botbash:
      return 1;
    case c.lobbyTypes.tryout:
      return 1;
    case c.lobbyTypes.replayAnalysis:
      return 1;
    case c.lobbyTypes.meeting:
      return 1;
  }
  return 0;
}

/**
 *  returns user table for a specific position
 *  @return array of table entries
 *  @param users array of LobbyPlayer
 *  @param position position of users
 *  @param mention if true mentions the users in the table
 */
function getPositionalUserTable(
  users: Array<LobbyPlayer>,
  position: number,
  mention = false
) {
  if (users.length == 0) {
    return undefined;
  }

  // setup fields for embedding
  var tableBase = [
    {
      name: "Position",
      value: position,
    },
    {
      name: "Name",
      value: "",
      inline: true,
    },
    {
      name: "Tier",
      value: "",
      inline: true,
    },
  ];

  // fill fields
  users.forEach((usr) => {
    tableBase[1].value =
      tableBase[1].value + "\r\n" + (mention ? "<@" + usr.id + ">" : usr.name);
    tableBase[2].value = tableBase[2].value + "\r\n" + usr.tier.name;
  });

  return tableBase;
}

function addUserWithPositionsToUserTable(
  tableBase: Array<FieldElement>,
  user: LobbyPlayer,
  positions: Array<number>,
  startIndex = 0,
  mention = false
) {
  tableBase[startIndex].value =
    tableBase[startIndex].value +
    "\r\n" +
    (user.region.name !== "" ? "[" + user.region.name + "]" : "") +
    (mention ? "<@" + user.id + ">" : user.name);
  tableBase[startIndex + 1].value =
    tableBase[startIndex + 1].value + "\r\n" + positions.join(", ");
  tableBase[startIndex + 2].value =
    tableBase[startIndex + 2].value + "\r\n" + user.tier.name;
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

/**
 *  returns a table of users
 *  @param tableBase table to which data is added
 *  @param users array of users
 *  @param playersPerLobby how many players fit in the lobby? rest is bench; value of -1 will allow any number
 *  @param mention if true mentions the users in the table
 */
function getUserTable(
  users: LobbyPlayer[],
  playersPerLobby = -1,
  mention = false
) {
  if (users.length == 0) {
    return undefined;
  }

  // setup fields for embedding
  var tableBase: Array<FieldElement> = [
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

  var tableBench: Array<FieldElement> = [
    {
      name: "Bench",
      value: "If people leave, you get pushed up",
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

  var startIndexPlayers = 0;
  var startIndexBench = 1;

  var usrIndex = 0;
  users.forEach((usr) => {
    if (usrIndex++ < playersPerLobby || playersPerLobby === -1)
      addToUserTable(tableBase, usr, startIndexPlayers, mention);
    else addToUserTable(tableBench, usr, startIndexBench, mention);
  });

  if (usrIndex > playersPerLobby && playersPerLobby !== -1) {
    var finalTable = tableBase.concat(tableBench);
    return finalTable;
  }

  return tableBase;
}

function getPlayersPerLobbyByLobbyType(type: number) {
  var key = Object.keys(c.lobbyTypes).find(
    (typeKey) => c.lobbyTypes[typeKey] == type
  );
  if (key) return c.lobbyTypePlayerCount[key];

  return 5; // just something reasonable...
}

/**
 *
 * @param lobby
 * @param mention
 * @returns
 */
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
  if (lobbyType == c.lobbyTypes.inhouse) {
    var tableBaseInhouse = [
      {
        name: "Side",
        value: "Radiant",
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
      addUserToTeam(tableBaseInhouse, teamAIndex, players[0], pos+1, mention);
      addUserToTeam(tableBaseInhouse, teamBIndex, players[1], pos+1, mention);
    }

    return tableBaseInhouse;
  } else if (
    lobbyType == c.lobbyTypes.unranked ||
    lobbyType == c.lobbyTypes.botbash ||
    lobbyType == c.lobbyTypes.tryout
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
      addUserToTeam(tableBase, teamIndex, players[0], pos+1, mention);
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
  const message = await channel.messages.fetch(messageId);
  if (unpin === true) message.unpin();

  // generate new embed
  const old_embed: MessageEmbed = message.embeds[0];
  var newEmbedTitle = titleUpdate + "\n~~" + old_embed.title + "~~";
  if (newEmbedTitle.length > 256) newEmbedTitle = newEmbedTitle.slice(0, 256);

  var new_embed: MessageEmbed = new Discord.MessageEmbed(old_embed).setTitle(
    newEmbedTitle
  );

  // update embed
  message.edit(new_embed);
}

/**
 * Removes lobby in backend
 * @param {Pool} dbHandle bot database handle
 * @param {Lobby} lobby lobby to remove
 */
async function removeLobby(dbHandle: Pool, lobby: Lobby) {
  dB.removeLobby(dbHandle, lobby);
}

function getIncompleteTeamPostTitle(type: number) {
  if (type === c.lobbyTypes.tryout) return "Tryout lobby starts now";
  if (type === c.lobbyTypes.replayAnalysis)
    return "Replay analysis session starts now";
  if (type === c.lobbyTypes.meeting) return "Meeting starts now";

  return "Not enough players for a lobby but we gotta get going anyway";
}

function getCompleteTeamPostTitle(type: number, counter: number) {
  var res = c.getLobbyNameByType(type);
  if (type === c.lobbyTypes.replayAnalysis) res += " session starts now";
  else if (type === c.lobbyTypes.meeting) res += " starts now";
  else
    res +=
      " lobby #" + counter + (counter == 1 ? " starts now" : " starts later");

  return res;
}

/**
 *  Creates an embedding for a starting lobby
 *  @param lobby lobby to start
 *  @param channel channel in which lobby resides
 *  @param playersPerLobby how many players per lobby (will create multiple lobbies if e.g. more than 2x the neccessary players showed up. Rest go to bench).
 */
function createLobbyStartPost(
  lobby: Lobby,
  channel: TextChannel | NewsChannel,
  playersPerLobby: number
) {
  var userSets: LobbyPlayer[][] = [];
  var userSet: LobbyPlayer[] = [];

  for (let i = 0; i < lobby.users.length; i++) {
    // add in batches of lobbyTypePlayerCount
    userSet.push(lobby.users[i]);

    if ((i + 1) % playersPerLobby == 0) {
      userSets.push(userSet);
      userSet = [];
    }
  }

  if (userSets.length === 0 && userSet.length !== 0) {
    // Not enough players but forced
    var title = getIncompleteTeamPostTitle(lobby.type);

    const _embed = aE.generateEmbedding(
      title,
      "",
      "",
      getUserTable(userSet, playersPerLobby, true)
    );
    channel.send({ embed: _embed });
    return;
  }

  var counter = 0;
  userSets.forEach((us) => {
    var teams = uH.createTeams(us, lobby.type);
    var teamTable = getTeamTable(teams, lobby.type, true);

    const _embed = aE.generateEmbedding(
      getCompleteTeamPostTitle(lobby.type, ++counter),
      "",
      "",
      teamTable
    );
    channel.send({ embed: _embed });
  });
  if (userSet.length != 0) {
    // bench
    const _embed = aE.generateEmbedding(
      "Today's bench",
      "",
      "",
      getUserTable(userSet, -1, true)
    );
    channel.send({ embed: _embed });
  }
}

async function updateLobbyPostAndDBEntry(
  lobby: Lobby,
  channel: TextChannel | NewsChannel | DMChannel,
  dbHandle: Pool
) {
  module.exports
    .updateLobbyPost(lobby, channel) // update lobby post
    .then(() => dB.updateLobby(dbHandle, lobby)) // update lobby in backend
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
  lobbyBeginnerRoles: string[],
  lobbyType: number,
  lobbyRegionRole: string,
  coaches: string[]
) {
  const maxCoachCount: number = getCoachCountByLobbyType(lobbyType);
  const coachCount: number = coaches === undefined ? 0 : coaches.length;
  var coachString = "";
  var coachStringPl = "";
  if (lobbyType === c.lobbyTypes.meeting) {
    coachString = "Chair";
    coachStringPl = "Chairs";
  } else {
    coachString = "Coach";
    coachStringPl = "Coaches";
  }

  return (
    "for " +
    rM.getRoleMentions(lobbyBeginnerRoles) +
    (coachCount === 0
      ? ""
      : coachCount >= 2 && maxCoachCount === 2
      ? "\n" + coachStringPl + ": <@" + coaches[0] + ">, <@" + coaches[1] + ">"
      : "\n" + coachString + ": <@" + coaches[0] + ">") +
    (c.isRoleBasedLobbyType(lobbyType)
      ? "\nRegion: " + rM.getRoleMention(lobbyRegionRole)
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
  if (c.isRoleBasedLobbyType(type)) {
    res += `${footerStringBeginner} \n\nPlayers from ${rM.getRegionalRoleString(
      regionRole
    )}-region will be moved up.`;
  } else if (type === c.lobbyTypes.tryout) {
    res += footerStringTryout;
  } else if (type === c.lobbyTypes.meeting) {
    res += footerStringMeeting;
  } else if (type === c.lobbyTypes.replayAnalysis)
    res += footerStringReplayAnalysis;

  if (type === c.lobbyTypes.meeting) {
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

module.exports = {
  /**
   *  Finds lobby by its channel and message
   *  @return undefined if not found, else returns the lobby
   *  @param dbHandle bot database handle
   *  @param channelId message channel id
   *  @param messageId message ID
   */
  findLobbyByMessage: async function (
    dbHandle: Pool,
    channelId: string,
    messageId: string
  ) {
    var lobbies = await dB.getLobbies(dbHandle, channelId, messageId);
    if (lobbies.length !== 1) return undefined;

    return lobbies[0];
  },

  /**
   * Internal function that creates the embedding for the lobby post
   * @param {mysql.Pool} dbHandle db handle
   * @param {Discord.Channel} channel lobby channel
   * @param {Array<String>} coaches lobby's coaches
   * @param {number} lobbyType type of lobby
   * @param {Array<String>} lobbyBeginnerRoles
   * @param {String} lobbyRegionRole
   * @param {Time} zonedTime time of lobby
   */
  postLobby: async function (
    dbHandle: Pool,
    channel: TextChannel,
    coachIDs: Array<string>,
    lobbyType: number,
    lobbyBeginnerRoles: Array<string>,
    lobbyRegionRole: string,
    zonedTime: Time
  ) {
    var title = `We host ${c.getLobbyPostNameByType(
      lobbyType
    )} on ${tZ.getTimeString(zonedTime)} ${zonedTime.zone.abbreviation}`;
    var text = getLobbyPostText(
      lobbyBeginnerRoles,
      lobbyType,
      lobbyRegionRole,
      coachIDs
    );
    var footer = getLobbyPostFooter(lobbyType, lobbyRegionRole);

    // send embedding post to lobby signup-channel
    const _embed = aE.generateEmbedding(title, text, footer);
    const lobbyPostMessage = await channel.send(
      rM.getRoleMentions(lobbyBeginnerRoles),
      { embed: _embed }
    ); // mentioning roles in message again to ping beginners

    // pin message to channel
    lobbyPostMessage.pin();

    // add emojis
    mH.createLobbyPostReactions(lobbyType, lobbyPostMessage);

    // create lobby data in database
    dB.insertLobby(
      dbHandle,
      new l.Lobby(
        lobbyType,
        zonedTime.epoch,
        coachIDs,
        lobbyBeginnerRoles,
        lobbyRegionRole,
        channel.id,
        lobbyPostMessage.id
      )
    );
  },

  removeLobby: removeLobby,

  /**
   *  Update lobby post to account for current lobby state
   *  @param lobby lobby state
   *  @param channel message channel
   */
  updateLobbyPost: async function (lobby: Lobby, channel: TextChannel) {
    // fetch message
    const message = await channel.messages.fetch(lobby.messageId);
    const old_embed: MessageEmbed = message.embeds[0];

    // generate new embed
    var new_embed = new Discord.MessageEmbed(old_embed);

    // generate new title
    var title = `We host ${c.getLobbyPostNameByType(
      lobby.type
    )} on ` + new_embed.title.split(" on ")[1];
    new_embed.title = title;
    // generate new embed description
    // save old time
    var descriptionLines = new_embed.description.split("\n");
    var timeString = descriptionLines[descriptionLines.length - 1];
    if (!timeString.startsWith(remainingLobbyTimeStartString)) timeString = "";

    new_embed.description =
      getLobbyPostText(
        lobby.beginnerRoleIds,
        lobby.type,
        lobby.regionId,
        lobby.coaches
      ) + (timeString !== "" ? "\n" + timeString : "");
    new_embed.fields = getCurrentUsersAsTable(lobby, true);

    // update embed
    await message.edit(new_embed);
  },

  /**
   *  Update lobby time of each lobby post and delete deprecated lobbies
   *  @param dbHandle handle to data base
   *  @param channels the bot's message channels on the server
   */
  updateLobbyTimes: async function (guild: Guild, dbHandle: Pool) {
    var lobbies: Lobby[] = await dB.getLobbies(dbHandle);

    var channels = guild.channels;

    for (const lobby of lobbies) {
      var channel: GuildChannel | undefined = channels.cache.find((chan) => {
        return chan.id == lobby.channelId;
      });
      if (!channel || !channel.isText()) continue;

      // fetch message
      const message = await getMessageFromChannel(channel, lobby.messageId);
      if (message === undefined) {
        await dB.removeLobby(dbHandle, lobby);
        continue;
      }

      const old_embed: MessageEmbed = message.embeds[0];
      if (old_embed === undefined) {
        await dB.removeLobby(dbHandle, lobby);
        continue;
      }

      var description = old_embed.description?.split("\n");
      if (description === undefined) description = [];
      if (
        description.length > 0 &&
        description[description.length - 1].startsWith(
          remainingLobbyTimeStartString
        )
      )
        description.pop();

      // get new time
      var remainingMs = lobby.date - Date.now();
      if (remainingMs > 0) {
        // if(lobby.notified === undefined && remainingMs < (1000*60*5)) {
        //     lobby.notified = true;
        //     dB.updateLobby(dbHandle, lobby);
        //     lobby.users.forEach(user => {

        //     })
        // }

        var minutes = Math.floor((remainingMs / (1000 * 60)) % 60);
        var hours = Math.floor(remainingMs / (1000 * 60 * 60));
        description.push(
          remainingLobbyTimeStartString +
            (hours > 0 ? hours + "h " : "") +
            minutes +
            "min"
        );
      } else {
        var minutes = Math.floor((-remainingMs / (1000 * 60)) % 60);
        var hours = Math.floor(-remainingMs / (1000 * 60 * 60));

        // more than 3 hours ago => delete lobby
        if (hours >= 3) {
          await updateAndUnpinLobbyEmbedding(
            lobby.messageId,
            channel,
            "[⛔ Removed deprecated lobby 😾]"
          );
          await removeLobby(dbHandle, lobby);
          continue;
        } else {
          if (
            description[description.length - 1].startsWith(
              alreadyStartedLobbyTimeStartString
            )
          )
            description.pop();
          description.push(
            alreadyStartedLobbyTimeStartString +
              (hours > 0 ? hours + "h " : "") +
              minutes +
              "min ago"
          );
        }
      }

      // generate new embed
      var new_embed = new Discord.MessageEmbed(old_embed);
      new_embed.description = description.join("\n");

      // update embed
      await message.edit(new_embed);
    }
  },

  /**
   *  Update lobby post to account for cancellation of lobby
   *  @param lobby lobby
   *  @param channel message channel
   */
  cancelLobbyPost: async function (
    lobby: Lobby,
    channel: TextChannel | NewsChannel
  ) {
    updateAndUnpinLobbyEmbedding(
      lobby.messageId,
      channel,
      "[⛔ Lobby cancelled! 😢]"
    );
  },

  getCurrentUsersAsTable: getCurrentUsersAsTable,

  /**
   * Starts lobby if time is up
   * @param {Discord.Client} client discord client
   * @param {JSON} lobby lobby to start
   * @param {Discord.User} user user who wants to start the lobby
   * @param {Discord.Channel} channel channel in which the lobby resides
   * @return true if lobby was started (and can therefore be removed)
   */
  startLobby: function (
    client: DFZDiscordClient,
    lobby: Lobby,
    user: User,
    channel: TextChannel | NewsChannel
  ) {
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

    // check player count
    if (lobby.users.length === 0) {
      updateAndUnpinLobbyEmbedding(
        lobby.messageId,
        channel,
        "[⛔ Cancelled because nobody showed up! 😭]"
      );
      user.send(
        "🔒 I started the lobby. Nobody signed up tho, so just play some Dotes instead 😎"
      );
      return;
    }

    const playersPerLobby = getPlayersPerLobbyByLobbyType(lobby.type);
    // create new post with match-ups
    createLobbyStartPost(lobby, channel, playersPerLobby);

    // notify players
    var notification =
      "Your " +
      c.getLobbyNameByType(lobby.type) +
      "-lobby just started! 😎 Please move to the voice channel and await further instructions.";
    notifyPlayers(client, lobby, playersPerLobby, notification);

    // delete the lobby and "archive" the lobby post
    updateAndUnpinLobbyEmbedding(
      lobby.messageId,
      channel,
      "[⛔ Lobby started already! 😎]"
    );

    // save coaches and players lobbies
    tr.saveCoachParticipation(client.dbHandle, lobby.coaches, lobby.type);
    tr.savePlayerParticipation(
      client.dbHandle,
      lobby.users,
      lobby.type,
      playersPerLobby
    );

    user.send("🔒 I started the lobby.");
    return true;
  },

  /**
   * manages removal of reaction in lobby post (position removal or player removal if last position)
   * @param {Pool} dbHandle
   * @param {MessageReaction} reaction reaction that was removed
   * @param {Lobby} lobby lobby that we look at
   * @param {User} user user who removed the reaction
   */
  updatePlayerInLobby: async function (
    dbHandle: Pool,
    reaction: MessageReaction,
    lobby: Lobby,
    user: User
  ) {
    // check reaction emojis
    var position = -1;

    // for simple lobbies just check '✅'
    if (c.isSimpleLobbyType(lobby.type)) {
      if (reaction.emoji.name !== c.tryoutReactionEmoji) return;
    } else {
      // for role based lobbies check positions
      position = c.getReactionEmojiPosition(reaction.emoji);
      if (position === 0)
        // if finds none => -1, but function adds one to match with ingame positions 1-5; therefore 0 = -1...
        return;
    }

    // check if lobby contains user
    var lobbyUser: LobbyPlayer = uH.getUser(lobby, user.id);
    if (lobbyUser === undefined) return;

    // for simple lobbies, always remove
    var removeUser = true;

    // if positions are relevant, remove positions
    if (c.isRoleBasedLobbyType(lobby.type)) {
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
  },

  /**
   *
   * @param {string[]} arguments
   * @param {Lobby} lobby
   */
  updateLobbyParameters: function (args: string[], lobby: Lobby) {
    var updateTiers = false,
        updateType = false,
        updateRegion = false,
        changedLobby = false;

    while (args.length > 0) {
      let arg = args[0];
      args.shift();

      if (arg === "-tiers") {
        updateTiers = true;
        continue;
      }

      if (arg === "-type") {
        updateType = true;
        continue;
      }

      if (arg === "-region") {
        updateRegion = true;
        continue;
      }

      if (updateTiers) {
        const minTier = 0; // Beginner tiers 0-4
        const maxTier = 4;
        var res: boolean = false,
          numbers: number[] = [],
          errormsg: string = "";

        [res, numbers, errormsg] = g.getNumbersFromString(
          arg,
          minTier,
          maxTier
        );
        if (!res) {
          return [false, errormsg];
        }

        var roles = rM.getBeginnerRolesFromNumbers(numbers);
        if (roles.length !== 0) {
          lobby.beginnerRoleIds = roles;
          changedLobby = true;
        }

        updateTiers = false;
        continue;
      }
      
      if (updateType) {

        var lobbyType = Object.keys(c.lobbyTypes).find((t) => {
          return t == arg;
        });
        
        if (lobbyType == undefined) {
          continue;
        }
        
        lobby.type = c.lobbyTypes[lobbyType];
        changedLobby = true;

        updateType = false;
        continue;
      }
      
      if (updateRegion) {

        var regionId = rM.getRegionalRoleFromString(arg);
        
        if (regionId == undefined) {
          continue;
        }
        
        lobby.regionId = regionId;
        changedLobby = true;

        updateRegion = false;
        continue;
      }
    }

    return [changedLobby, ""];
  },

  /**
   * Adds coach to existing lobby
   * @param {Pool} dbHandle
   * @param {Channel} channel
   * @param {Lobby} lobby
   * @param {string} userId
   * @returns true if successful, false if not
   */
  addCoach: async function (
    dbHandle: Pool,
    channel: TextChannel,
    lobby: Lobby,
    userId: string
  ) {
    return new Promise<boolean>(function (resolve, reject) {
      if (lobby.coaches === undefined) {
        reject("Lobby does not support coaches yet.");
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
  },

  /**
   * Removes coach from existing lobby
   * @param {Pool} dbHandle
   * @param {TextChannel} channel
   * @param {Lobby} lobby
   * @param {string} userId
   * @returns true if successful, false if not
   */
  removeCoach: async function (
    dbHandle: Pool,
    channel: TextChannel,
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
  },
};
