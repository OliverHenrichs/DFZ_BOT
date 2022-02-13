import {Collection, GuildMember, Role} from "discord.js";
import {DFZDataBaseClient} from "../logic/database/DFZDataBaseClient";
import {SQLUtils} from "../logic/database/SQLUtils";
import {DFZDiscordClient} from "../logic/discord/DFZDiscordClient";
import {beginnerRoles, findRole, findRoles, getRegionalRolePrefix,} from "../logic/discord/roleManagement";
import {Player} from "../logic/serializables/player";
import {PlayerSerializer} from "../logic/serializers/PlayerSerializer";
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
  await maybeInsertPlayer(dbClient, newMember);
}

function isSuitableBeginner(oldMember: GuildMember, newMember: GuildMember) {
  const oldRole = findRole(oldMember, beginnerRoles);
  const newRole = findRole(newMember, beginnerRoles);
  return oldRole === undefined && newRole !== undefined;
}

async function maybeInsertPlayer(
  dbClient: DFZDataBaseClient,
  newMember: GuildMember
) {
  if (!(await playerExists(dbClient, newMember))) {
    insertPlayer(dbClient, newMember);
  }
}

async function playerExists(
  dbClient: DFZDataBaseClient,
  newMember: GuildMember
): Promise<boolean> {
  const gdbc = SerializeUtils.fromGuildtoGuildDBClient(
    newMember.guild,
    dbClient
  );
  const serializer = new PlayerSerializer(gdbc, newMember.user.id);
  const players = await serializer.get();
  return players.length > 0;
}

function insertPlayer(
  dbClient: DFZDataBaseClient,
  newMember: GuildMember
): void {
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
