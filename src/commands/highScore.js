const aE = require("../misc/answerEmbedding");
const t = require("../misc/tracker");
const mH = require("../misc/messageHelper");

/**
 *
 * @param {JSON} tableBase
 * @param {JSON} dbRow
 */
function addDBCoachRowToTable(tableBase, dbRow) {
  tableBase[0].value = tableBase[0].value + "\r\n<@" + dbRow.user_id + ">";
  tableBase[1].value = tableBase[1].value + "\r\n" + dbRow.lobbyCount;
  tableBase[2].value = tableBase[2].value + "\r\n" + dbRow.lobbyCountNormal;
  tableBase[3].value = tableBase[3].value + "\r\n" + dbRow.lobbyCountTryout;
  tableBase[4].value =
    tableBase[4].value + "\r\n" + dbRow.lobbyCountReplayAnalysis;
}

/**
 *
 * @param {JSON} tableBase
 * @param {JSON} dbRow
 */
function addDBPlayerRowToTable(tableBase, dbRow) {
  tableBase[0].value = tableBase[0].value + "\r\n<@" + dbRow.userId + ">";
  tableBase[1].value = tableBase[1].value + "\r\n" + dbRow.lobbyCount;
  tableBase[2].value = tableBase[2].value + "\r\n" + dbRow.lobbyCountUnranked;
  tableBase[3].value = tableBase[3].value + "\r\n" + dbRow.lobbyCount5v5;
  tableBase[4].value = tableBase[4].value + "\r\n" + dbRow.lobbyCountBotBash;
  tableBase[5].value =
    tableBase[5].value + "\r\n" + dbRow.lobbyCountReplayAnalysis;
}

/**
 *
 * @param {JSON} tableBase
 * @param {JSON} dbRow
 */
function addDBReferrerRowToTable(tableBase, dbRow) {
  tableBase[0].value = tableBase[0].value + "\r\n" + dbRow.tag;
  tableBase[1].value = tableBase[1].value + "\r\n" + dbRow.referralCount;
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
  {
    name: "Referral Count",
    value: "",
    inline: true,
  },
];

/**
 * Returns list of coaches and their lobby count as a private message to the messaging user
 * @param {Discord.Message} message triggering message
 * @param {mysql.Pool} dbHandle bot database handle
 */
module.exports = async (message, dbHandle) => {
  var arguments = mH.getArguments(message);

  var nextisLobbyType = false,
    lobbyType = "",
    nextIsUserType = false,
    userType = "";

  while (arguments.length > 0) {
    let arg = arguments[0];
    arguments.shift();

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

  var dbResponse = [];

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
    dbResponse = await t.getPlayerList(dbHandle, lt);
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
    dbResponse = await t.getCoachList(dbHandle, lt);
  } else if (ut === "referrers") {
    dbResponse = await t.getReferrerList(dbHandle);
  }

  const maxNum = 10;
  for (let i = 0; i < Math.min(maxNum, dbResponse.length); i++) {
    if (ut === "players") {
      addDBPlayerRowToTable(tableBase, dbResponse[i]);
    } else if (ut === "coaches") {
      addDBCoachRowToTable(tableBase, dbResponse[i]);
    } else if (ut === "referrers") {
      addDBReferrerRowToTable(tableBase, dbResponse[i]);
    }
  }

  var _embed = aE.generateEmbedding(
    "Lobby Highscores (" + ut + ") Top 10",
    "Hall of Fame of DFZ " + ut + "!",
    "",
    dbResponse.length > 0 ? tableBase : []
  );

  mH.reactPositive(message);
  message.author.send({ embed: _embed });
};
