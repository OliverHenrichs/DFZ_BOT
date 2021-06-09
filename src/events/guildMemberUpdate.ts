import { Collection, GuildMember, Role } from "discord.js";
import { DFZDiscordClient } from "../types/DFZDiscordClient";
import {
  findRole,
  regionRoleIDs,
  getRegionalRolePrefix,
  beginnerRoles,
  findRoles,
} from "../misc/roleManagement";
import { Player } from "../types/serializables/player";
import { DFZDataBaseClient } from "../types/database/DFZDataBaseClient";
import { PlayerSerializer } from "../types/serializers/playerSerializer";
import { ReferrerSerializer } from "../types/serializers/referrerSerializer";

function getRoleBasedPrefixes(roles: Collection<string, Role>) {
  var prefixes: string[] = [];
  roles.forEach((role) => {
    const prefix = getRegionalRolePrefix(role.id);
    if (prefix !== "") prefixes.push(prefix);
  });
  return prefixes;
}

/**
 * Update nickname on regional role change
 */
function updateNickname(member: GuildMember) {
  const regionRoles = findRoles(member, regionRoleIDs);
  const prefixes = getRoleBasedPrefixes(regionRoles);

  member
    .setNickname(
      prefixes.join("") + member.user.username,
      `Updated Nickname to ${prefixes.join("")}${member.displayName}`
    )
    .catch((err) => {
      console.log(
        `Could not update nickname of ${member.user.username}: ${err}`
      );
    });
  return true;
}

async function awardPointToReferrer(
  player: Player,
  dbClient: DFZDataBaseClient
) {
  // only award if player named a referrer and isn't already locked
  if (player.referredBy === "" || player.referralLock) return;
  const serializer = new ReferrerSerializer(dbClient, player.referredBy);
  const referrers = await serializer.get();

  if (referrers.length > 0) {
    const referrer = referrers[0];
    referrer.referralCount += 1;
    serializer.update(referrer);
  }

  player.referralLock = 1; // add lock after awarding once
  const playerSerializer = new PlayerSerializer(dbClient, player.referredBy);
  playerSerializer.update(player);
}

/**
 * When a beginner completes their tryout, they get their first beginner role
 * Here we
 * a) insert that player in the DB (if they have not been added yet)
 * b) check referral code of the player in the DB and award a point to the referrer
 * @param {Pool} dbHandle bot db handle
 * @param {GuildMember} oldMember
 * @param {GuildMember} newMember
 */
async function handleFirstBeginnerRole(
  dbClient: DFZDataBaseClient,
  oldMember: GuildMember,
  newMember: GuildMember
) {
  var oldRole = findRole(oldMember, beginnerRoles);
  var newRole = findRole(newMember, beginnerRoles);
  if (oldRole !== undefined || newRole === undefined) {
    return;
  }

  const serializer = new PlayerSerializer(dbClient, newMember.user.id);
  const players = await serializer.get();
  if (players.length === 0) {
    await serializer.insert(new Player(newMember.user.id, newMember.user.tag));
  } else {
    await awardPointToReferrer(players[0], dbClient);
  }
}

/**
 * Emitted whenever a guild member changes - i.e. role or nickname.
 * @param {Discord.Client} client discord client
 * @param {GuildMember} oldMember The member before the update
 * @param {GuildMember} newMember The member after the update
 */
module.exports = async (
  client: DFZDiscordClient,
  oldMember: GuildMember,
  newMember: GuildMember
) => {
  // ignore if roles did not change
  if (oldMember.roles.cache.size === newMember.roles.cache.size) return;

  updateNickname(newMember);

  handleFirstBeginnerRole(client.dbClient, oldMember, newMember);
};
