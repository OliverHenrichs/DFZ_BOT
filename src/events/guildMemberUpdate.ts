import { Collection, GuildMember, Role } from "discord.js";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";
import {
  findRole,
  regionRoleIDs,
  getRegionalRolePrefix,
  beginnerRoles,
  findRoles,
} from "../logic/discord/roleManagement";
import { Player } from "../logic/serializables/player";
import { DFZDataBaseClient } from "../logic/database/DFZDataBaseClient";
import { PlayerSerializer } from "../logic/serializers/playerSerializer";
import { ReferrerSerializer } from "../logic/serializers/referrerSerializer";

/**
 * Handles role and nickname changes
 * @param {Discord.Client} client discord client
 * @param {GuildMember} oldMember The member before the update
 * @param {GuildMember} newMember The member after the update
 */
module.exports = async (
  client: DFZDiscordClient,
  oldMember: GuildMember,
  newMember: GuildMember
) => {
  if (!haveRolesChange(oldMember, newMember)) return;
  tryUpdateGuildMember(client.dbClient, oldMember, newMember);
};

function haveRolesChange(oldMember: GuildMember, newMember: GuildMember) {
  return oldMember.roles.cache.size !== newMember.roles.cache.size;
}

async function tryUpdateGuildMember(
  dbClient: DFZDataBaseClient,
  oldMember: GuildMember,
  newMember: GuildMember
) {
  try {
    await updateNickname(newMember);
    await handleFirstBeginnerRole(dbClient, oldMember, newMember);
  } catch (error) {
    console.log(`Failed guildMemberUpdate: ${error}`);
  }
}

async function updateNickname(member: GuildMember) {
  const regionRoles = findRoles(member, regionRoleIDs);
  const prefixes = getRoleBasedPrefixes(regionRoles);

  await member.setNickname(
    prefixes.join("") + member.user.username,
    `Updated Nickname to ${prefixes.join("")}${member.displayName}`
  );
}

function getRoleBasedPrefixes(roles: Collection<string, Role>) {
  var prefixes: string[] = [];
  roles.forEach((role) => {
    const prefix = getRegionalRolePrefix(role.id);
    if (prefix !== "") prefixes.push(prefix);
  });
  return prefixes;
}

async function handleFirstBeginnerRole(
  dbClient: DFZDataBaseClient,
  oldMember: GuildMember,
  newMember: GuildMember
) {
  if (!isSuitableBeginner(oldMember, newMember)) return;
  await insertOrUpdatePlayerAndAwardReferral(dbClient, newMember);
}

function isSuitableBeginner(oldMember: GuildMember, newMember: GuildMember) {
  var oldRole = findRole(oldMember, beginnerRoles);
  var newRole = findRole(newMember, beginnerRoles);
  return oldRole === undefined && newRole !== undefined;
}

async function insertOrUpdatePlayerAndAwardReferral(
  dbClient: DFZDataBaseClient,
  newMember: GuildMember
) {
  const player = await getExistingPlayer(dbClient, newMember);
  if (!player) {
    await insertPlayer(dbClient, newMember);
  } else if (hasReferrer(player)) {
    await updatePlayer(player, dbClient);
    await awardPointToReferrer(player, dbClient);
  }
}

async function getExistingPlayer(
  dbClient: DFZDataBaseClient,
  newMember: GuildMember
): Promise<Player | undefined> {
  const serializer = new PlayerSerializer(dbClient, newMember.user.id);
  const players = await serializer.get();
  if (players.length === 0) return undefined;
  return players[0];
}

function insertPlayer(dbClient: DFZDataBaseClient, newMember: GuildMember) {
  const serializer = new PlayerSerializer(dbClient, newMember.user.id);
  serializer.insert(new Player(newMember.user.id, newMember.user.tag));
}

function hasReferrer(player: Player) {
  return player.referredBy === "" && !player.referralLock;
}

async function updatePlayer(player: Player, dbClient: DFZDataBaseClient) {
  player.referralLock = 1;
  const playerSerializer = new PlayerSerializer(dbClient, player.referredBy);
  playerSerializer.update(player);
}

async function awardPointToReferrer(
  player: Player,
  dbClient: DFZDataBaseClient
) {
  const serializer = new ReferrerSerializer(dbClient, player.referredBy);
  const referrer = await getReferrer(serializer);

  referrer.referralCount += 1;

  serializer.update(referrer);
}

async function getReferrer(serializer: ReferrerSerializer) {
  const referrers = await serializer.get();
  if (referrers.length === 0)
    throw new Error("Could not find referrer when trying to award point");
  return referrers[0];
}
