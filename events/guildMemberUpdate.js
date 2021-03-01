const dB = require("../misc/database")
const rM = require("../misc/roleManagement")
const pL = require("../misc/player")

/**
 * Checks if member has nickname
 * @param {Discord.GuildMember} member 
 */
function hasNickname(member) {
    return member.nickname !== undefined && member.nickname !== null;
}

/**
 * Update nickname on regional role change
 * @param {Discord.GuildMember} oldMember 
 * @param {Discord.GuildMember} newMember 
 */
function updateNickname(oldMember, newMember) {
    
    var oldRole = rM.findRole(oldMember, rM.regionRoleIDs);
    var newRole = rM.findRole(newMember, rM.regionRoleIDs);
    if(oldRole === newRole) 
        return false;

    // add or remove?
    var addRole = newRole !== null;

    // which prefix to look for?
    var prefix = rM.getRegionalRolePrefix(addRole ? newRole.id : oldRole.id);
    if(prefix == "")
        return false;

    if(addRole) // set nick to reflect role
    {
        newMember.setNickname(prefix+newMember.displayName, "Added regional role " + prefix).catch(err => { 
            console.log("Could not change nickname of " + newMember.displayName);
        });
    } else if (hasNickname(newMember)) // if user has nick => remove it now
    {
        newMember.setNickname(null, "Removed regional role " + prefix).catch(err => { 
            console.log("Could not remove nickname of " + newMember.displayName);
        })
    }

    return true;
}


/**
 * Inserts player in DB if they have not been added yet
 * Checks referral code if the player already existed and awards a point to the referrer
 * @param {mysql.Pool} dbHandle bot db handle
 * @param {Discord.GuildMember} oldMember 
 * @param {Discord.GuildMember} newMember 
 */
async function handleFirstBeginnerRole(dbHandle, oldMember, newMember) {
    var oldRole = rM.findRole(oldMember, rM.beginnerRolesWithoutTryout);
    var newRole = rM.findRole(newMember, rM.beginnerRolesWithoutTryout);
    if(oldRole !== undefined || newRole === undefined)  {
        return false;
    }
    
    var player = await dB.getPlayerByID(dbHandle, newMember.user.id);
    if(player === undefined) {
        dB.insertPlayer(dbHandle, new pL.Player(newMember.user.id, newMember.user.tag));
    } else if (player.referredBy !== "" && !player.referralLock) {
        referrer = await dB.getPlayerByTag(dbHandle, player.referredBy)
        referrer.referralCount += 1;
        await dB.updatePlayer(dbHandle, referrer);
        
        player.referralLock = 1;
        await dB.updatePlayer(dbHandle, player);
    }

    return true;
}

/**
 * Emitted whenever a guild member changes - i.e. role or nickname.
 * @param {Discord.Client} client discord client
 * @param {Discord.GuildMember} oldMember The member before the update
 * @param {Discord.GuildMember} newMember The member after the update
 */
module.exports = async (client, oldMember, newMember) => {
    // ignore if roles did not change
    if(oldMember.roles.cache.size === newMember.roles.cache.size)
        return;

    if(updateNickname(oldMember, newMember))
        return;

    handleFirstBeginnerRole(client.dbHandle, oldMember, newMember);
}