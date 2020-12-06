const beginnerRoles = [process.env.TRYOUT, process.env.TIER_1, process.env.TIER_2, process.env.TIER_3, process.env.TIER_4];
const regionRoleIDs = [process.env.REGION_EU_ROLE, process.env.REGION_NA_ROLE, process.env.REGION_SEA_ROLE];

/**
* Returns prefix of given role for name adjustment
* @param {number} roleId id of regional role to check
* @return corresponding regional prefix
*/
function getRegionalRoleString(roleId) 
{
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
};

// role management
module.exports = {
	adminRoles: [process.env.COACH],
	beginnerRoles: beginnerRoles,
	regionRoleIDs: regionRoleIDs,
	
	isAdminRole: function(role)
	{
		return this.adminRoles.find(r => r === role);
	},

	/**
		Check if message sender has at least one of the roles given by rolesToCheck
		@param rolesToCheck list of role names to be checked against
		@param member the guild member who is being checked for having certain roles
		@return the found role or undefined if it didn't find one
	*/
	findRole: function (member, rolesToCheck) {
		if (rolesToCheck.length === 0) {
			return undefined;
		}

		return member.roles.find(role => rolesToCheck.includes(role.id));
	},
	
	/**
		takes a sequence of numbers and returns the respective role names for numbers 0-4
		@param number list of numbers, e.g. [0,1,2,3,4]
		@return list of roles corresponding to given numbers
	*/
	getBeginnerRolesFromNumbers: function (numbers) {
		var roles = [];
		numbers.forEach(num => {
			if(num == 0)
				roles.push(process.env.TRYOUT)
			else if(num == 1)
				roles.push(process.env.TIER_1)
			else if(num == 2)
				roles.push(process.env.TIER_2)
			else if(num == 3)
				roles.push(process.env.TIER_3)
			else if(num == 4)
				roles.push(process.env.TIER_4)
			else
				console.log("current number " + num + " is not corresponding to a role");
		});

		return roles;
	},

	/**
		Returns number corresponding to role (Beginner Tier 1 => 1, 2 => 2 , ...)
		@param roleId id of given role
		@return corresponding number
	*/
	getNumberFromBeginnerRole: function (roleId) {
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
		}
	},

	/**
	 * Returns prefix of given role for name adjustment
	 * @param {number} roleId id of regional role to check
	 * @return corresponding regional prefix
	 */
	getRegionalRolePrefix: function(roleId) {
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
	},	
	
	getRegionalRoleString: getRegionalRoleString,

	getRegionalRoleStringsForCommand: function() {
		var res = [];
		regionRoleIDs.forEach((rid) => res.push(getRegionalRoleString(rid)));
		return res;
	},

	getRegionalRoleFromString: function(roleString) {
		switch (roleString) {
			case 'EU':
				return regionRoleIDs[0];
			case 'NA':
				return regionRoleIDs[1];
			case 'SEA':
				return regionRoleIDs[2];
			default:
				return undefined;
		}
	},

	/**
		takes a sequence of roles and returns the role mention-strings
		@param roles list of roles
		@return list of corresponding role strings
	*/
	getRoleMentions: function (roles) {
		return roles.map((tier) => {
			return `<@&${tier}>`;
		  }).join(' ');
	}, 

	/**
		returns a mention string of a role id
		@param role the role id
		@return string with mention of corresponding role
	*/
	getRoleMention: function (role) {
		return `<@&${role}>`;
	}
}