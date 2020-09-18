

const beginnerRoles = [process.env.TIER_1, process.env.TIER_2, process.env.TIER_3, process.env.TIER_4];

// role management
module.exports = {
	adminRoles: [process.env.COACH],
	beginnerRoles: beginnerRoles,
	
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
		takes a sequence of numbers and returns the respective role names for numbers 1-4
		@param number list of numbers, e.g. [1,2,3,4]
		@return list of roles corresponding to given numbers
	*/
	getRolesFromNumbers: function (numbers) {
		var roles = [];
		numbers.forEach(num => {
			if(num == 0)
				roles.push(process.env.Tryout)
			if(num == 1)
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

		var uniqueNumbers = new Set(numbers);
		return roles;
	},

	/**
		Returns number corresponding to role (Beginner Tier 1 => 1, 2 => 2 , ...)
		@param role given role
		@return corresponding number
	*/
	getNumberFromBeginnerRole: function (role) {
		
		switch (role) {
			case beginnerRoles[0]:
				return 1;
			case beginnerRoles[1]:
				return 2;
			case beginnerRoles[2]:
				return 3;
			case beginnerRoles[3]:
				return 4;

		}
	},

	/**
		takes a sequence of roles and returns the role strings
		@param roles list of roles
		@return list of corresponding role strings
	*/
	getRoleStrings: function (roles) {
		return roles.map((tier) => {
			return `<@&${tier}>`;
		  }).join(' ');
	}	
}