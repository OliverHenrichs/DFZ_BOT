import { Message } from "discord.js";
import Pool from "mysql2/typings/mysql/lib/Pool";

const dB = require("../misc/database");
const mH = require("../misc/messageHelper");
const lM = require("../misc/lobbyManagement");

/**
 * Checks if lobby exists and updates lobby post depending on message
 * @param {Message} message coaches message that triggered the lobby update
 * @param {Pool} dbHandle bot database handle
 */
module.exports = async (message: Message, dbHandle: Pool) => {
  var args = mH.getArguments(message);

  if (args.length == 0 || args == "") {
    mH.reactNegative(
      message,
      "No message ID given. \r\n Add the message ID of the lobby you want to update."
    );
    return;
  }

  var lobby = await lM.findLobbyByMessage(
    dbHandle,
    message.channel.id,
    args[0]
  );
  if (lobby === undefined) {
    mH.reactNegative(message, "Did not find lobby given the Id.");
    return;
  }

  // remove message ID from args
  args.shift();

  //return mH.reactNegative(message, errormsg);
  var res: boolean = false,
    errormsg: string = "";
  [res, errormsg] = lM.updateLobbyParameters(args, lobby);
  if (res !== true)
    return mH.reactNegative(
      message,
      "Failed updating lobby parameters: " + errormsg
    );

  dB.updateLobby(dbHandle, lobby)
    .then(lM.updateLobbyPost(lobby, message.channel))
    .then(mH.reactPositive(message, "Updated lobby parameters."));
};
