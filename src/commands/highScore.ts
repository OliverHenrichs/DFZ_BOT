import { Message } from "discord.js";
import { Pool } from "mysql2/promise";
import { generateEmbedding } from "../misc/answerEmbedding";
import { getSortedCoaches, getSortedPlayers, getSortedReferrers } from "../misc/database";
import { FieldElement } from "../misc/interfaces/EmbedInterface";
import { getArguments, reactPositive } from "../misc/messageHelper";
import { Coach } from "../misc/types/coach";
import { Player } from "../misc/types/player";
import { Referrer } from "../misc/types/referrer";

/**
 *
 * @param {Array<FieldElement>} tableBase
 * @param {Coach} coach
 */
function addDBCoachRowToTable(tableBase: Array<FieldElement>, coach: Coach) {
  tableBase[0].value = tableBase[0].value + "\r\n<@" + coach.userId + ">";
  tableBase[1].value = tableBase[1].value + "\r\n" + coach.lobbyCount;
  tableBase[2].value = tableBase[2].value + "\r\n" + coach.lobbyCountNormal;
  tableBase[3].value = tableBase[3].value + "\r\n" + coach.lobbyCountTryout;
  tableBase[4].value =
    tableBase[4].value + "\r\n" + coach.lobbyCountReplayAnalysis;
}

/**
 *
 * @param {Array<FieldElement>} tableBase
 * @param {Player} player
 */
function addDBPlayerRowToTable(tableBase: Array<FieldElement>, player: Player) {
  tableBase[0].value = tableBase[0].value + "\r\n<@" + player.userId + ">";
  tableBase[1].value = tableBase[1].value + "\r\n" + player.lobbyCount;
  tableBase[2].value = tableBase[2].value + "\r\n" + player.lobbyCountUnranked;
  tableBase[3].value = tableBase[3].value + "\r\n" + player.lobbyCount5v5;
  tableBase[4].value = tableBase[4].value + "\r\n" + player.lobbyCountBotBash;
  tableBase[5].value =
    tableBase[5].value + "\r\n" + player.lobbyCountReplayAnalysis;
}

/**
 *
 * @param {JSON} tableBase
 * @param {Referrer} referrer
 */
function addDBReferrerRowToTable(
  tableBase: Array<FieldElement>,
  referrer: Referrer
) {
  tableBase[0].value = tableBase[0].value + "\r\n" + referrer.tag;
  tableBase[1].value = tableBase[1].value + "\r\n" + referrer.referralCount;
}

const tableBaseReferrersTemplate = [
  {
    name: "Referrer",
    value: "",
    inline: true,
  },
  {
    name: "Referral Count",
    value: "",
    inline: true,
  },
];

const tableBaseCoachesTemplate = [
  {
    name: "Coach",
    value: "",
    inline: true,
  },
  {
    name: "Total Coached Lobbies",
    value: "",
    inline: true,
  },
  {
    name: "Regular Lobbies",
    value: "",
    inline: true,
  },
  {
    name: "Tryouts",
    value: "",
    inline: true,
  },
  {
    name: "Replay Analyses",
    value: "",
    inline: true,
  },
];

const tableBasePlayersTemplate = [
  {
    name: "Player",
    value: "",
    inline: true,
  },
  {
    name: "Total played",
    value: "",
    inline: true,
  },
  {
    name: "Unranked",
    value: "",
    inline: true,
  },
  {
    name: "5v5",
    value: "",
    inline: true,
  },
  {
    name: "Botbash",
    value: "",
    inline: true,
  },
  {
    name: "Replay Analyses",
    value: "",
    inline: true,
  },
];

/**
 * Returns list of coaches and their lobby count as a private message to the messaging user
 * @param {Message} message triggering message
 * @param {Pool} dbHandle bot database handle
 */
export default  async (message: Message, dbHandle: Pool) => {
  var args = getArguments(message);

  var nextisLobbyType = false,
    lobbyType = "",
    nextIsUserType = false,
    userType = "";

  while (args.length > 0) {
    let arg = args[0];
    args.shift();

    if (arg === "-userType" || arg === "-ut") {
      nextIsUserType = true;
      continue;
    }

    if (arg === "-lobbyType" || arg === "-lt") {
      nextisLobbyType = true;
      continue;
    }

    if (nextisLobbyType) {
      lobbyType = arg;
      nextisLobbyType = false;
      continue;
    }

    if (nextIsUserType) {
      userType = arg;
      nextIsUserType = false;
      continue;
    }
  }

  var dbResponse : Array<Player | Coach | Referrer> = [];

  var ut = "";
  var tableBase = undefined;
  switch (userType) {
    case "players":
      ut = "players";
      tableBase = JSON.parse(JSON.stringify(tableBasePlayersTemplate));
      break;
    case "referrers":
      ut = "referrers";
      tableBase = JSON.parse(JSON.stringify(tableBaseReferrersTemplate));
      break;
    case "coaches":
    default:
      ut = "coaches";
      tableBase = JSON.parse(JSON.stringify(tableBaseCoachesTemplate));
  }

  var lt = "";
  if (ut === "players") {
    switch (lobbyType) {
      case "unranked":
        lt = "lobbyCountUnranked";
        break;
      case "5v5":
        lt = "lobbyCount5v5";
        break;
      case "botbash":
        lt = "lobbyCountBotBash";
        break;
      case "replayAnalysis":
        lt = "lobbyCountReplayAnalysis";
        break;
      default:
        lt = "lobbyCount";
    }
    dbResponse = await getSortedPlayers(dbHandle, lt);
  } else if (ut === "coaches") {
    switch (lobbyType) {
      case "tryout":
        lt = "lobbyCountTryout";
        break;
      case "normal":
        lt = "lobbyCountNormal";
        break;
      case "replayAnalysis":
        lt = "lobbyCountReplayAnalysis";
        break;
      default:
        lt = "lobbyCount";
    }
    dbResponse = await getSortedCoaches(dbHandle, lt);
  } else if (ut === "referrers") {
    dbResponse = await getSortedReferrers(dbHandle);
  }


  function isPlayer(type: Player | Coach | Referrer): type is Player {
    return (type as Player).offenses !== undefined;
  }
  
  function isCoach(type: Player | Coach | Referrer): type is Coach {
    return (type as Coach).lobbyCount !== undefined;
  }
  
  function isReferrer(type: Player | Coach | Referrer): type is Referrer {
    return (type as Referrer).referralCount !== undefined;
  }

  const maxNum = 10;
  for (let i = 0; i < Math.min(maxNum, dbResponse.length); i++) {
    var responseRow = dbResponse[i];
    if (ut === "players") {
      if(isPlayer(responseRow)) addDBPlayerRowToTable(tableBase, responseRow);
    } else if (ut === "coaches") {
      if(isCoach(responseRow)) addDBCoachRowToTable(tableBase, responseRow);
    } else if (ut === "referrers") {
      if(isReferrer(responseRow)) addDBReferrerRowToTable(tableBase, responseRow);
    }
  }

  reactPositive(message);
  if(dbResponse.length > 0) {
    var _embed = generateEmbedding(
      "Lobby Highscores (" + ut + ") Top 10",
      "Hall of Fame of DFZ " + ut + "!",
      "",
      dbResponse.length > 0 ? tableBase : []
    );
    message.author.send({ embed: _embed });
  } else {
    message.author.send("No highscore entries yet.");
  }

};
