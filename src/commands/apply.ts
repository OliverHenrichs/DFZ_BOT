import { Message } from "discord.js";
import {
  getPlayerByID,
  getReferrerByTag,
  insertReferrer,
  insertPlayer,
} from "../misc/database";
import { DFZDiscordClient } from "../misc/types/DFZDiscordClient";
import { Player } from "../misc/types/player";
import { Referrer } from "../misc/types/referrer";

function getTrimmedArguments(message: string) {
  var args = message.substring(6).split(",");
  args.forEach((element) => {
    element.trim();
  });

  return args;
}

function getRefTagFromArgs(args: string[]) {
  var refTag = "";
  // if it's available then at the 4th position
  if (args.length > 4 && args[4] !== undefined) {
    var refTag = args[4].trim();
  }
  return refTag;
}

function validateReferralTag(refTag: string): string | undefined {
  var re = /\S+#\d{4,5}/i; // matching user tag syntax asdf#1234
  const match = refTag.match(re);
  if (!match || match.length === 0) return undefined;

  return match[0];
}

function getReferralTag(message: string): string | undefined {
  var args = getTrimmedArguments(message);
  var referralTag = getRefTagFromArgs(args);
  return validateReferralTag(referralTag);
}

function addReferrer(client: DFZDiscordClient, refTag: string) {
  // Is referrer part of the server?
  var referrerId = undefined;
  const referrerUser = client.users.cache.find((u) => u.tag === refTag);
  if (referrerUser !== undefined) {
    referrerId = referrerUser.id;
  }
  insertReferrer(
    client.dbHandle,
    new Referrer(referrerId === undefined ? "" : referrerId, refTag, 0)
  );
}

function handleReferrerTag(client: DFZDiscordClient, refTag: string) {
  getReferrerByTag(client.dbHandle, refTag).then(
    (existingReferrer: Referrer | undefined) => {
      if (existingReferrer) return;
      addReferrer(client, refTag);
    }
  );
}

/**
 * Adds player to db on application in application channel
 */
export default async (client: DFZDiscordClient, message: Message) => {
  var player = await getPlayerByID(client.dbHandle, message.author.id);
  if (player !== undefined) return;

  const refTag = getReferralTag(message.content);
  if (refTag) handleReferrerTag(client, refTag);

  insertPlayer(
    client.dbHandle,
    new Player(message.author.id, message.author.tag, refTag ? refTag : "")
  );
};
