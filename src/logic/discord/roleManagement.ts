import { roleMention } from "@discordjs/builders";
import { Collection, GuildMember, Role } from "discord.js";
import { dfzGuildId } from "../../misc/constants";
import { EnvironmentVariableManager as EVM } from "../misc/EnvironmentVariableManager";
import { RegionDefinitions } from "../time/RegionDefinitions";
import { DFZDiscordClient } from "./DFZDiscordClient";
import { INamedRole } from "./interfaces/INamedRole";

export const beginnerRoles = [
  EVM.ensureString(process.env.TIER_0),
  EVM.ensureString(process.env.TIER_1),
  EVM.ensureString(process.env.TIER_2),
  EVM.ensureString(process.env.TIER_3),
  EVM.ensureString(process.env.TIER_4),
];
export const namedBeginnerRoles: INamedRole[] =
  getIDsAsNamedRoles(beginnerRoles);

export const tryoutRole = EVM.ensureString(process.env.TRYOUT);

export const adminRoles = [
  EVM.ensureString(process.env.COACH),
  EVM.ensureString(process.env.COACH_TRYOUT),
  EVM.ensureString(process.env.COMPANION),
];
export const companionRole = EVM.ensureString(process.env.COMPANION_M);

export const namedRegionRoles: INamedRole[] = getIDsAsNamedRoles(
  RegionDefinitions.regionRoles
);

export function getIDsAsNamedRoles(roles: string[]): INamedRole[] {
  return roles.map((role) => {
    return { id: role, name: roleMention(role) };
  });
}

/**
		Check if message sender has at least one of the roles given by rolesToCheck
		@param {Array<Int>} rolesToCheck list of role names to be checked against
		@param {Discord.Member} member the guild member who is being checked for having certain roles
		@return the found role or undefined if it didn't find one
	*/
export function findRole(
  member: GuildMember,
  rolesToCheck: Array<string>
): Role | undefined {
  if (rolesToCheck.length === 0) {
    return undefined;
  }

  return member.roles.cache.find((role: Role) => {
    return rolesToCheck.includes(role.id);
  });
}

/**
  Return all roles matching the rolesToCheck role IDs
*/
export function findRoles(
  member: GuildMember,
  rolesToCheck: Array<string>
): Collection<string, Role> {
  if (rolesToCheck.length === 0) {
    return new Collection<string, Role>();
  }
  const cache = member.roles.cache;
  return cache.filter((role: Role) => rolesToCheck.includes(role.id));
}

/**
		takes a sequence of numbers and returns the respective role names for numbers 0-4
		@param {Array<Int>} number list of numbers, e.g. [0,1,2,3,4]
		@return {Array<Int>} list of roles corresponding to given numbers
	*/
export function getBeginnerRolesFromNumbers(numbers: Set<number>) {
  var roles: Array<string> = [];
  numbers.forEach((num) => {
    if (num == 0) roles.push(beginnerRoles[0]);
    else if (num == 1) roles.push(beginnerRoles[1]);
    else if (num == 2) roles.push(beginnerRoles[2]);
    else if (num == 3) roles.push(beginnerRoles[3]);
    else if (num == 4) roles.push(beginnerRoles[4]);
    else if (num == 5) roles.push(tryoutRole);
    else console.log(`current number ${num} is not corresponding to a role`);
  });

  return roles;
}

/**
		Returns number corresponding to role (Beginner Tier 1 => 1, 2 => 2 , ...)
		@param roleId id of given role
		@return corresponding number
	*/
export function getNumberFromBeginnerRole(roleId: string | undefined) {
  switch (roleId) {
    case beginnerRoles[0]:
      return 0;
    case beginnerRoles[1]:
      return 1;
    case beginnerRoles[2]:
      return 2;
    case beginnerRoles[3]:
      return 3;
    case beginnerRoles[4]:
      return 4;
    case tryoutRole:
      return 5;
    default:
      return NaN;
  }
}

/**
 * Returns prefix of given role for name adjustment
 * @param {string} roleId id of regional role to check
 * @return corresponding regional prefix
 */
export function getRegionalRolePrefix(roleId: string | undefined) {
  const region = RegionDefinitions.regions.find(
    (region) => region.role === roleId
  );
  if (region) return region.userNamePrefix;
  return "";
}

/**
 * Returns standard timezone given the region role
 * @param {string} roleId id of regional role to check
 * @return {string} corresponding timezone name
 */
export function getRegionalRoleTimeZoneString(roleId: string | undefined) {
  const region = RegionDefinitions.regions.find(
    (region) => region.role === roleId
  );
  if (region) return region.timeZoneName;
  return "";
}

/**
 * Returns prefix of given role for name adjustment
 * @param {number} roleId id of regional role to check
 * @return corresponding regional prefix
 */
export function getRegionalRoleString(roleId: string | undefined) {
  const region = RegionDefinitions.regions.find(
    (region) => region.role === roleId
  );
  if (region) return region.name;
  return "";
}

/**
 * Returns prefix of given role for name adjustment
 * @param {string} roleId id of regional role to check
 * @return corresponding regional prefix
 */
export function getRegionalRoleLobbyChannel(roleId: string | undefined) {
  const region = RegionDefinitions.regions.find(
    (region) => region.role === roleId
  );
  if (region) return region.lobbyChannelId;
  return "";
}

export function getAllRegionNames() {
  return RegionDefinitions.regionRoles.map((rid) => getRegionalRoleString(rid));
}

/**
 * Returns role id corresponding to role string
 * @param {string} roleString
 */
export function getRegionalRoleFromString(
  roleString: string | undefined
): string {
  const regionRole = RegionDefinitions.regions.find(
    (region) => region.name === roleString
  );
  if (!regionRole)
    throw new Error(`Unknown regional role string ${roleString}`);
  return regionRole.lobbyChannelId;
}

/**
		takes a sequence of roles and returns the role mention-strings
		@param roles list of roles
		@return list of corresponding role strings
	*/
export function getRoleMentions(roles: Array<string>) {
  return roles
    .map((tier) => {
      return roleMention(tier);
    })
    .join(" ");
}

export function getAdminRoles(
  client: DFZDiscordClient,
  guildId: string = dfzGuildId
): Collection<string, Role> {
  return getRoles(client, adminRoles, guildId);
}

export function getBeginnerRoles(
  client: DFZDiscordClient,
  guildId: string = dfzGuildId
): Collection<string, Role> {
  return getRoles(client, beginnerRoles, guildId);
}

export function getRegionRoles(
  client: DFZDiscordClient,
  guildId: string = dfzGuildId
): Collection<string, Role> {
  return getRoles(client, RegionDefinitions.regionRoles, guildId);
}

function getRoles(
  client: DFZDiscordClient,
  rolesToChooseFrom: string[],
  guildId: string
): Collection<string, Role> {
  const guild = client.guilds.cache.get(guildId);

  let roles = guild?.roles.cache.filter(
    (r) => rolesToChooseFrom.find((role) => role === r.id) !== undefined
  );
  if (!roles) throw new Error("Did not find any roles for role select.");
  return roles;
}
