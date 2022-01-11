import { Message } from "discord.js";
import { SQLUtils } from "../logic/database/SQLUtils";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";
import { Player } from "../logic/serializables/player";
import { Referrer } from "../logic/serializables/referrer";
import { PlayerSerializer } from "../logic/serializers/PlayerSerializer";
import { ReferrerSerializer } from "../logic/serializers/ReferrerSerializer";
import { SerializeUtils } from "../logic/serializers/SerializeUtils";
import { IGuildDataBaseClient } from "../logic/serializers/types/IGuildDataBaseClient";
import {
  getGuildFromMessage,
  reactNegative,
  reactPositive,
} from "../misc/messageHelper";
import { IGuildClient } from "../misc/types/IGuildClient";

export default async (client: DFZDiscordClient, message: Message) => {
  try {
    await tryApplyUser(message, client);
    reactPositive(message, "You just signed up :) Thanks!", false);
  } catch (error) {
    reactNegative(message, error as string, false);
  }
};

async function tryApplyUser(message: Message, client: DFZDiscordClient) {
  const guild = getGuildFromMessage(message);

  const gdbc = SerializeUtils.fromGuildtoGuildDBClient(guild, client.dbClient);
  const serializer = new PlayerSerializer(gdbc, message.author.id);
  var player = await serializer.get();
  if (player.length > 0) throw new Error("You have already signed up");

  const guildClient: IGuildClient = { guild, client };
  const refTag = SQLUtils.escape(getReferralTag(message.content));
  if (refTag) handleReferrerTag(guildClient, refTag);

  serializer.insert(
    new Player(
      message.author.id,
      guild.id,
      SQLUtils.escape(message.author.tag),
      refTag ? refTag : ""
    )
  );
}

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

function getRefTagFromArgs(args: string[]): string {
  const refTagPosition = 4;
  if (args.length > refTagPosition && args[refTagPosition] !== undefined) {
    return args[refTagPosition].trim();
  }
  return "";
}

function validateReferralTag(refTag: string): string | undefined {
  var re = /\S+#\d{4,5}/i; // matching user tag syntax asdf#1234
  const match = refTag.match(re);
  if (!match || match.length === 0) return undefined;
  return match[0];
}

async function handleReferrerTag(client: IGuildClient, refTag: string) {
  const dbGuildClient: IGuildDataBaseClient = {
    dbClient: client.client.dbClient,
    guildId: client.guild.id,
  };
  const serializer = new ReferrerSerializer(dbGuildClient, refTag);
  if (!(await serializer.get())) addReferrer(client, serializer, refTag);
}

function addReferrer(
  client: IGuildClient,
  serializer: ReferrerSerializer,
  refTag: string
) {
  const referrerId = findReferrerId(refTag, client);
  serializer.insert(
    new Referrer(
      referrerId === undefined ? "Unknown" : referrerId,
      client.guild.id,
      refTag,
      0
    )
  );
}

function findReferrerId(
  refTag: string,
  client: IGuildClient
): string | undefined {
  const referrerUser = client.client.users.cache.find((u) => u.tag === refTag);
  if (referrerUser !== undefined) {
    return referrerUser.id;
  }
  return undefined;
}
