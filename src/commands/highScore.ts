import { Message } from "discord.js";
import { Pool } from "mysql2/promise";
import { generateEmbedding } from "../misc/answerEmbedding";
import { getSortedCoaches, getSortedPlayers, getSortedReferrers } from "../misc/database";
import { tableBasePlayersTemplate, tableBaseReferrersTemplate, tableBaseCoachesTemplate, addDBPlayerRowToTable, addDBCoachRowToTable, addDBReferrerRowToTable } from "../misc/highScoreTables";
import { getArguments, reactPositive } from "../misc/messageHelper";
import { Coach } from "../misc/types/coach";
import { Player } from "../misc/types/player";
import { Referrer } from "../misc/types/referrer";


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
