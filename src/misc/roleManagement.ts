import { Collection, GuildMember, Role } from "discord.js";

export const beginnerRoles = [
  process.env.TIER_0 ? process.env.TIER_0 : "",
  process.env.TIER_1 ? process.env.TIER_1 : "",
  process.env.TIER_2 ? process.env.TIER_2 : "",
  process.env.TIER_3 ? process.env.TIER_3 : "",
  process.env.TIER_4 ? process.env.TIER_4 : "",
];
export const tryoutRole = process.env.TRYOUT ? process.env.TRYOUT : "";
export const regionRoleIDs = [
  process.env.REGION_EU_ROLE ? process.env.REGION_EU_ROLE : "",
  process.env.REGION_NA_ROLE ? process.env.REGION_NA_ROLE : "",
  process.env.REGION_SEA_ROLE ? process.env.REGION_SEA_ROLE : "",
];
export const adminRoles = [
  process.env.COACH ? process.env.COACH : "",
  process.env.COACH_TRYOUT ? process.env.COACH_TRYOUT : "",
  process.env.COMPANION ? process.env.COMPANION : "",
];

export function isAdminRole(role: string) {
  return adminRoles.find((r: string | undefined) => r === role);
}

/**
		Check if message sender has at least one of the roles given by rolesToCheck
		@param {Array<Int>} rolesToCheck list of role names to be checked against
		@param {Discord.Member} member the guild member who is being checked for having certain roles
		@return the found role or undefined if it didn't find one
	*/
export function findRole(member: GuildMember, rolesToCheck: Array<string>) {
  if (rolesToCheck.length === 0) {
    return undefined;
  }

  return member.roles.cache.find((role: Role) =>
    rolesToCheck.includes(role.id)
  );
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

  return member.roles.cache.filter((role: Role) =>
    rolesToCheck.includes(role.id)
  );
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
  switch (roleId) {
    case regionRoleIDs[0]:
      return "[EU] ";
    case regionRoleIDs[1]:
      return "[NA] ";
    case regionRoleIDs[2]:
      return "[SEA] ";
    default:
      return "";
  }
}

/**
 * Returns standard timezone given the region role
 * @param {string} roleId id of regional role to check
 * @return {string} corresponding timezone name
 */
export function getRegionalRoleTimeZoneString(roleId: string | undefined) {
  switch (roleId) {
    case regionRoleIDs[0]:
      return "Europe/Berlin";
    case regionRoleIDs[1]:
      return "America/New_York";
    case regionRoleIDs[2]:
      return "Asia/Singapore";
    default:
      return "";
  }
}

/**
 * Returns prefix of given role for name adjustment
 * @param {number} roleId id of regional role to check
 * @return corresponding regional prefix
 */
export function getRegionalRoleString(roleId: string | undefined) {
  switch (roleId) {
    case regionRoleIDs[0]:
      return "EU";
    case regionRoleIDs[1]:
      return "NA";
    case regionRoleIDs[2]:
      return "SEA";
    default:
      return "";
  }
}

/**
 * Returns prefix of given role for name adjustment
 * @param {string} roleId id of regional role to check
 * @return corresponding regional prefix
 */
export function getRegionalRoleLobbyChannel(roleId: string | undefined) {
  switch (roleId) {
    case regionRoleIDs[0]:
      return process.env.BOT_LOBBY_CHANNEL_EU;
    case regionRoleIDs[1]:
      return process.env.BOT_LOBBY_CHANNEL_NA;
    case regionRoleIDs[2]:
      return process.env.BOT_LOBBY_CHANNEL_SEA;
    default:
      return "";
  }
}

export function getAllRegionStrings() {
  return regionRoleIDs.map((rid) => getRegionalRoleString(rid));
}

/**
 * Returns role id corresponding to role string
 * @param {string} roleString
 */
export function getRegionalRoleFromString(
  roleString: string | undefined
): string {
  switch (roleString) {
    case "EU":
      return regionRoleIDs[0];
    case "NA":
      return regionRoleIDs[1];
    case "SEA":
      return regionRoleIDs[2];
    default:
      throw `Unknown regional role string ${roleString}`;
  }
}

/**
		takes a sequence of roles and returns the role mention-strings
		@param roles list of roles
		@return list of corresponding role strings
	*/
export function getRoleMentions(roles: Array<string>) {
  return roles
    .map((tier) => {
      return `<@&${tier}>`;
    })
    .join(" ");
}

/**
		returns a mention string of a role id
		@param role the role id
		@return string with mention of corresponding role
	*/
export function getRoleMention(role: string) {
  return `<@&${role}>`;
}
