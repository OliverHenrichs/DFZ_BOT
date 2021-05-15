import { Collection, GuildMember, Role } from "discord.js";
import { Pool } from "mysql2/promise";
import {
  getPlayerByID,
  insertPlayer,
  getReferrerByTag,
  updateReferrer,
  updatePlayer,
} from "../misc/database";
import { DFZDiscordClient } from "../misc/types/DFZDiscordClient";
import {
  findRole,
  regionRoleIDs,
  getRegionalRolePrefix,
  beginnerRoles,
  findRoles,
} from "../misc/roleManagement";
import { Player } from "../misc/types/player";

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

function awardPointToReferrer(player: Player, dbHandle: Pool) {
  // only award if player named a referrer and isn't already locked
  if (player.referredBy === "" || player.referralLock) return;

  getReferrerByTag(dbHandle, player.referredBy).then((referrer) => {
    if (referrer !== undefined) {
      referrer.referralCount += 1;
      updateReferrer(dbHandle, referrer);
    }
    player.referralLock = 1; // add lock after awarding once
    updatePlayer(dbHandle, player);
  });
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
function handleFirstBeginnerRole(
  dbHandle: Pool,
  oldMember: GuildMember,
  newMember: GuildMember
) {
  var oldRole = findRole(oldMember, beginnerRoles);
  var newRole = findRole(newMember, beginnerRoles);
  if (oldRole !== undefined || newRole === undefined) {
    return;
  }

  getPlayerByID(dbHandle, newMember.user.id).then((player) => {
    if (player === undefined) {
      insertPlayer(dbHandle, new Player(newMember.user.id, newMember.user.tag));
    } else {
      awardPointToReferrer(player, dbHandle);
    }
  });
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

  handleFirstBeginnerRole(client.dbHandle, oldMember, newMember);
};
