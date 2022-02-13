import {Collection, GuildMember, Role} from "discord.js";
import {DFZDataBaseClient} from "../logic/database/DFZDataBaseClient";
import {SQLUtils} from "../logic/database/SQLUtils";
import {DFZDiscordClient} from "../logic/discord/DFZDiscordClient";
import {beginnerRoles, findRole, findRoles, getRegionalRolePrefix,} from "../logic/discord/roleManagement";
import {Player} from "../logic/serializables/player";
import {PlayerSerializer} from "../logic/serializers/PlayerSerializer";
import {ReferrerSerializer} from "../logic/serializers/ReferrerSerializer";
import {SerializeUtils} from "../logic/serializers/SerializeUtils";
import {RegionDefinitions} from "../logic/time/RegionDefinitions";

/**
 * Handles role and nickname changes.
 */
module.exports = async (
  client: DFZDiscordClient,
  oldMember: GuildMember,
  newMember: GuildMember
) => {
  if (!haveRolesChanged(oldMember, newMember)) return;
  await tryUpdateGuildMember(client.dbClient, oldMember, newMember);
};

function haveRolesChanged(oldMember: GuildMember, newMember: GuildMember) {
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
  const regionRoles = findRoles(member, RegionDefinitions.regionRoles);
  const prefixes = getRoleBasedPrefixes(regionRoles);

  await member.setNickname(
    prefixes.join("") + member.user.username,
    `Updated Nickname to ${prefixes.join("")}${member.displayName}`
  );
}

function getRoleBasedPrefixes(roles: Collection<string, Role>) {
  const prefixes: string[] = [];
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
  const oldRole = findRole(oldMember, beginnerRoles);
  const newRole = findRole(newMember, beginnerRoles);
  return oldRole === undefined && newRole !== undefined;
}

async function insertOrUpdatePlayerAndAwardReferral(
  dbClient: DFZDataBaseClient,
  newMember: GuildMember
) {
  try {
    const player = await getExistingPlayer(dbClient, newMember);
    if (hasReferrer(player)) {
      await updatePlayer(player, dbClient);
      await awardPointToReferrer(player, dbClient);
    }
  } catch (error) {
    insertPlayer(dbClient, newMember);
  }
}

async function getExistingPlayer(
  dbClient: DFZDataBaseClient,
  newMember: GuildMember
): Promise<Player> {
  const gdbc = SerializeUtils.fromGuildtoGuildDBClient(
    newMember.guild,
    dbClient
  );
  const serializer = new PlayerSerializer(gdbc, newMember.user.id);
  const players = await serializer.get();
  if (players.length === 0) throw new Error("No player.");
  return players[0];
}

function insertPlayer(dbClient: DFZDataBaseClient, newMember: GuildMember) {
  const uid = newMember.user.id;
  const gid = newMember.guild.id;
  const gdbc = SerializeUtils.fromGuildtoGuildDBClient(
    newMember.guild,
    dbClient
  );
  const serializer = new PlayerSerializer(gdbc, uid);
  serializer.insert(new Player(uid, gid, SQLUtils.escape(newMember.user.tag)));
}

function hasReferrer(player: Player) {
  return player.referredBy === "" && !player.referralLock;
}

async function updatePlayer(player: Player, dbClient: DFZDataBaseClient) {
  const gdbc = SerializeUtils.fromPlayertoGuildDBClient(player, dbClient);
  player.referralLock = 1;
  const playerSerializer = new PlayerSerializer(
    gdbc,
    SQLUtils.escape(player.referredBy)
  );
  playerSerializer.update(player);
}

async function awardPointToReferrer(
  player: Player,
  dbClient: DFZDataBaseClient
) {
  const gdbc = SerializeUtils.fromPlayertoGuildDBClient(player, dbClient);
  const tag = SQLUtils.escape(player.referredBy);
  const serializer = new ReferrerSerializer(gdbc, tag);
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
