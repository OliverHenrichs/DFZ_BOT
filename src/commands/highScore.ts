import { Message } from "discord.js";
import { Pool } from "mysql2/promise";
import { generateEmbedding } from "../misc/answerEmbedding";
import {
  getSortedCoaches,
  getSortedPlayers,
  getSortedReferrers,
} from "../misc/database";
import {
  tableBasePlayersTemplate,
  tableBaseReferrersTemplate,
  tableBaseCoachesTemplate,
  addDBPlayerRowToTable,
  addDBCoachRowToTable,
  addDBReferrerRowToTable,
} from "../misc/highScoreTables";
import { FieldElement } from "../misc/interfaces/EmbedInterface";
import { getArguments, reactPositive } from "../misc/messageHelper";
import { Coach } from "../misc/types/coach";
import { Player } from "../misc/types/player";
import { Referrer } from "../misc/types/referrer";

interface HighScoreOptions {
  userType: "players" | "coaches" | "referrers";
  lobbyType:
    | "unranked"
    | "5v5"
    | "botbash"
    | "replayAnalysis"
    | "tryout"
    | "normal"
    | "all";
}

function handleArguments(args: string[]): HighScoreOptions {
  var nextisLobbyType = false,
    nextIsUserType = false;

  var highScoreOptions: HighScoreOptions = {
    userType: "coaches",
    lobbyType: "all",
  };

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
      highScoreOptions.lobbyType = arg as any;
      nextisLobbyType = false;
      continue;
    }

    if (nextIsUserType) {
      highScoreOptions.userType = arg as any;
      nextIsUserType = false;
      continue;
    }
  }

  return highScoreOptions;
}

function getTableBase(options: HighScoreOptions): FieldElement[] {
  switch (options.userType) {
    case "players":
      return JSON.parse(JSON.stringify(tableBasePlayersTemplate));
    case "referrers":
      return JSON.parse(JSON.stringify(tableBaseReferrersTemplate));
    case "coaches":
    default:
      return JSON.parse(JSON.stringify(tableBaseCoachesTemplate));
  }
}

function getDBLobbyType(options: HighScoreOptions) {
  if (options.userType === "players") {
    switch (options.lobbyType) {
      case "unranked":
        return "lobbyCountUnranked";
      case "5v5":
        return "lobbyCount5v5";
      case "botbash":
        return "lobbyCountBotBash";
      case "replayAnalysis":
        return "lobbyCountReplayAnalysis";
      default:
        return "lobbyCount";
    }
  }

  // other type with lobbies is "coaches"
  switch (options.lobbyType) {
    case "tryout":
      return "lobbyCountTryout";
    case "normal":
      return "lobbyCountNormal";
    case "replayAnalysis":
      return "lobbyCountReplayAnalysis";
    default:
      return "lobbyCount";
  }
}

async function getUsers(
  dbHandle: Pool,
  options: HighScoreOptions,
  dbLobbyType: string
) {
  try {
    if (options.userType === "players") {
      return getSortedPlayers(dbHandle, dbLobbyType);
    } else if (options.userType === "coaches") {
      return getSortedCoaches(dbHandle, dbLobbyType);
    } else if (options.userType === "referrers") {
      return getSortedReferrers(dbHandle);
    }
  } catch (e) {
    return undefined;
  }
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

function fillHighscoreTable(
  options: HighScoreOptions,
  tableBase: FieldElement[],
  dbResponse: Array<Player | Coach | Referrer>
) {
  const maxNum = 10;
  for (let i = 0; i < Math.min(maxNum, dbResponse.length); i++) {
    var responseRow = dbResponse[i];
    if (options.userType === "players") {
      if (isPlayer(responseRow)) addDBPlayerRowToTable(tableBase, responseRow);
    } else if (options.userType === "coaches") {
      if (isCoach(responseRow)) addDBCoachRowToTable(tableBase, responseRow);
    } else if (options.userType === "referrers") {
      if (isReferrer(responseRow))
        addDBReferrerRowToTable(tableBase, responseRow);
    }
  }
}

function sendHighscoreTable(
  message: Message,
  options: HighScoreOptions,
  tableBase: FieldElement[]
) {
  reactPositive(message);

  var _embed = generateEmbedding(
    "Lobby Highscores (" + options.userType + ") Top 10",
    "Hall of Fame of DFZ " + options.userType + "!",
    "",
    tableBase
  );
  message.author.send({ embed: _embed });
}

/**
 * Returns list of coaches and their lobby count as a private message to the messaging user
 * @param {Message} message triggering message
 * @param {Pool} dbHandle bot database handle
 */
export default async (message: Message, dbHandle: Pool) => {
  var args = getArguments(message);
  const highScoreOptions = handleArguments(args);

  var tableBase = getTableBase(highScoreOptions);

  var dbResponse: Array<Player | Coach | Referrer> | undefined = await getUsers(
    dbHandle,
    highScoreOptions,
    getDBLobbyType(highScoreOptions)
  );
  if (!dbResponse || dbResponse.length === 0)
    return message.author.send("No highscore entries yet.");

  fillHighscoreTable(highScoreOptions, tableBase, dbResponse);

  sendHighscoreTable(message, highScoreOptions, tableBase);
};
