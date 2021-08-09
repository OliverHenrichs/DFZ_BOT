import { Message } from "discord.js";
import { getArguments, reactNegative } from "../misc/messageHelper";
import providerFactory from "../logic/highscore/factories/HighscoreProviderFactory";
import { DFZDataBaseClient } from "../logic/database/DFZDataBaseClient";
import { HighscoreUserTypes } from "../logic/highscore/enums/HighscoreUserTypes";

/**
 * Returns list of coaches and their lobby count as a private message to the messaging user
 * @param {Message} message triggering message
 * @param {Pool} dbHandle bot database handle
 */
export default async (message: Message, dbClient: DFZDataBaseClient) => {
  try {
    const options = getOptionsFromMessage(message);
    const highScoreProvider = providerFactory(options.userType, dbClient);
    await highScoreProvider.postHighscore(message);
  } catch (error) {
    reactNegative(message, "Could not post highscore: " + error);
  }
};

interface HighScoreOptions {
  userType: HighscoreUserTypes;
  lobbyType: number;
}

function getOptionsFromMessage(message: Message) {
  var args = getArguments(message);
  return parseArguments(args);
}

function parseArguments(args: string[]): HighScoreOptions {
  var nextIsUserType = false;

  var highScoreOptions: HighScoreOptions = {
    userType: HighscoreUserTypes.coaches,
    lobbyType: -1,
  };

  while (args.length > 0) {
    let arg = args[0];
    args.shift();

    if (arg === "-userType" || arg === "-ut") {
      nextIsUserType = true;
      continue;
    }

    if (nextIsUserType) {
      highScoreOptions.userType = getHighScoreUserTypeByString(arg);
      nextIsUserType = false;
      continue;
    }
  }

  return highScoreOptions;
}

function getHighScoreUserTypeByString(type: string): HighscoreUserTypes {
  if (type === HighscoreUserTypes.players) return HighscoreUserTypes.players;
  if (type === HighscoreUserTypes.coaches) return HighscoreUserTypes.coaches;
  if (type === HighscoreUserTypes.referrers)
    return HighscoreUserTypes.referrers;

  throw `You did not provide a valid user type; valid user types are ${Object.values(
    HighscoreUserTypes
  ).join(",")}.`;
}
