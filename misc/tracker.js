const c = require("../misc/constants")
const co = require("../misc/coach")
const db = require("../misc/database")
const pl = require("../misc/player");
const { DiscordAPIError } = require("discord.js");

/**
 * 
 * @param {mysql.Pool} dbHandle bot database handle
 * @param {Array<String>} coaches coach ids
 * @param {int} lobbyType lobby type 
 */
async function saveCoachParticipation(dbHandle, coaches, lobbyType) {
    var isTryout = lobbyType === c.lobbyTypes.tryout;
    var isReplayAnalysis = lobbyType === c.lobbyTypes.replayAnalysis;
    var isNormal = !isTryout && !isReplayAnalysis;

    for (let i = 0; i < coaches.length; i++) {
        var coachId = coaches[i];
        var dBCoach = await db.getCoach(dbHandle, coachId);
        if(dBCoach === undefined) {
            await db.insertCoach(dbHandle, new co.Coach(coachId, 1, (isTryout? 1 : 0), (isNormal? 1 : 0), (isReplayAnalysis? 1 : 0)));
        } else {
            dBCoach.lobbyCount += 1;

            if(isTryout)
                dBCoach.lobbyCountTryout += 1;
            else if(isReplayAnalysis)
                dBCoach.lobbyCountReplayAnalysis += 1;
            else 
                dBCoach.lobbyCountNormal += 1;

            await db.updateCoach(dbHandle, dBCoach);
        }
    }
}

/**
 * Calls db to get coach list sorted by columnName
 * @param {mysql.Pool} dbHandle 
 * @param {String} columnName 
 */
async function getCoachList(dbHandle, columnName) {
    return new Promise(function(resolve, reject) {
        db.getSortedCoaches(dbHandle, columnName)
        .then(coaches => resolve(coaches[0]))
        .catch((err) => reject(err));
    });
}

/**
 * Calls db to get player list sorted by columnName
 * @param {mysql.Pool} dbHandle 
 * @param {String} columnName 
 */
async function getPlayerList(dbHandle, columnName) {
    return new Promise(function(resolve, reject) {
        db.getSortedPlayers(dbHandle, columnName)
        .then(coaches => resolve(coaches[0]))
        .catch((err) => reject(err));
    });
}

/**
 * Increase Player lobby count
 * @param {mysql.Pool} dbHandle 
 * @param {Discord.User} users 
 * @param {int} lobbyType 
 * @param {int} playersPerLobby 
 */
async function savePlayerParticipation(dbHandle, users, lobbyType, playersPerLobby) {
    var isReplayAnalysis = lobbyType === c.lobbyTypes.replayAnalysis;
    var isUnranked = lobbyType === c.lobbyTypes.unranked;
    var is5v5 = lobbyType === c.lobbyTypes.inhouse;
    var isBotbash = lobbyType === c.lobbyTypes.botbash;

    for (let i = 0; i < Math.min(users.length, playersPerLobby); i++) {
        var player = await db.getPlayerByID(dbHandle, users[i].id)
        
        if(player === undefined) {
            await db.insertPlayer(
                dbHandle, 
                new pl.Player(  
                    users[i].id, users[i].tag, "", 0,  1, 
                    (isUnranked? 1 : 0), 
                    (isBotbash? 1 : 0), 
                    (is5v5? 1 : 0), 
                    (isReplayAnalysis? 1 : 0), 
                    0
                )
            );
        } else {
            player.lobbyCount += 1;
            
            if(isReplayAnalysis)
                player.lobbyCountReplayAnalysis += 1;
            else if(isUnranked)
                player.lobbyCountUnranked += 1;
            else if(is5v5)
                player.lobbyCount5v5 += 1;
            else if(isBotbash)
                player.lobbyCountBotBash += 1;

            await db.updatePlayer(dbHandle, player);
        }
    }
}

module.exports = {
    saveCoachParticipation: saveCoachParticipation,
    savePlayerParticipation: savePlayerParticipation,
    getCoachList: getCoachList,
    getPlayerList: getPlayerList
}