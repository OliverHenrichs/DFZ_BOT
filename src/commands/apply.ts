import { Message } from "discord.js";
import { SQLUtils } from "../logic/database/SQLUtils";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";
import { Player } from "../logic/serializables/player";
import { Referrer } from "../logic/serializables/referrer";
import { PlayerSerializer } from "../logic/serializers/playerSerializer";
import { ReferrerSerializer } from "../logic/serializers/referrerSerializer";
import { reactNegative, reactPositive } from "../misc/messageHelper";

export default async (client: DFZDiscordClient, message: Message) => {
  const serializer = new PlayerSerializer(client.dbClient, message.author.id);
  var player = await serializer.get();
  if (player.length > 0) {
    reactNegative(message, "You have already signed up", false);
    return;
  }
  const refTag = SQLUtils.escape(getReferralTag(message.content));
  if (refTag) handleReferrerTag(client, refTag);

  serializer.insert(
    new Player(
      message.author.id,
      SQLUtils.escape(message.author.tag),
      refTag ? refTag : ""
    )
  );
  reactPositive(message, "You just signed up :) Thanks!", false);
};

function getReferralTag(message: string): string | undefined {
  var args = getTrimmedMessageArguments(message);
  var referralTag = getRefTagFromArgs(args);
  return validateReferralTag(referralTag);
}

function getTrimmedMessageArguments(message: string) {
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

async function handleReferrerTag(client: DFZDiscordClient, refTag: string) {
  const serializer = new ReferrerSerializer(client.dbClient, refTag);
  if (!(await serializer.get())) addReferrer(client, serializer, refTag);
}

function addReferrer(
  client: DFZDiscordClient,
  serializer: ReferrerSerializer,
  refTag: string
) {
  const referrerId = findReferrerId(refTag, client);
  serializer.insert(
    new Referrer(referrerId === undefined ? "Unknown" : referrerId, refTag, 0)
  );
}

function findReferrerId(
  refTag: string,
  client: DFZDiscordClient
): string | undefined {
  const referrerUser = client.users.cache.find((u) => u.tag === refTag);
  if (referrerUser !== undefined) {
    return referrerUser.id;
  }
  return undefined;
}
