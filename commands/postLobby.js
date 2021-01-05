const c = require("../misc/constants")
const mH = require("../misc/messageHelper")
const rM = require("../misc/roleManagement")
const lM = require("../misc/lobbyManagement")

/**
 * Checks if lobby exists and posts lobby post depending on lobby type
 * @param {Discord.Message} message coaches message that triggered the lobby post
 * @param {mysql.Connection} dbHandle bot database handle
 */
module.exports = async (message, dbHandle) => {
	var type = mH.getLobbyType(message);
	if(type == undefined)
		return;
        
	// tryout 'region' and role
	var lobbyRegionRole = undefined;
	var beginnerRoleNumbers = [0];

	if(type !== c.lobbyTypes.tryout)
	{
		// get region role
		var lobbyRegionRole = mH.getLobbyRegionRoleFromMessage(message, 1);
		if (lobbyRegionRole === undefined)
			return mH.reactNegative(message, "Failed to recognize region, has to be any of '" + rM.getRegionalRoleStringsForCommand().join("', '") + "'");

		// get beginner roles
		const minRole = 1;
		const maxRole = 4;
		[res, beginnerRoleNumbers, errormsg] = mH.getNumbersFromMessage(message, 2, minRole, maxRole);
		if(!res) {
			return mH.reactNegative(message, errormsg);
		}
	}

	var lobbyBeginnerRoles = rM.getBeginnerRolesFromNumbers(beginnerRoleNumbers);

	// get zoned time
	const tryoutIndex = 1;
	const allOtherTypesIndex = 3;
	[res, zonedTime, zoneName, errormsg] = mH.getTimeFromMessage(message, type == c.lobbyTypes.tryout ? tryoutIndex : allOtherTypesIndex);
	if(!res) {
		return mH.reactNegative(message, errormsg);
	}

	lM.postLobby(dbHandle, message.channel, type, lobbyBeginnerRoles, lobbyRegionRole, zonedTime, zoneName)
	.then(()=>{
        // react to coach's command
        mH.reactPositive(message);
	})
}