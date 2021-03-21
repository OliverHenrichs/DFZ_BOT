"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const c = require("./constants");
const co = require("./types/coach");
const db = require("./database");
const pl = require("./types/player");
/**
 *
 * @param {Pool} dbHandle bot database handle
 * @param {Array<string>} coaches coach ids
 * @param {number} lobbyType lobby type
 */
async function saveCoachParticipation(dbHandle, coaches, lobbyType) {
    var isTryout = lobbyType === c.lobbyTypes.tryout;
    var isReplayAnalysis = lobbyType === c.lobbyTypes.replayAnalysis;
    var isNormal = !isTryout && !isReplayAnalysis;
    console.log("Starting saveCoachParticipation for " +
        coaches.length +
        (coaches.length > 1 ? "coaches" : "coach"));
    for (let i = 0; i < coaches.length; i++) {
        var coachId = coaches[i];
        console.log("checking existence of coach " + coachId);
        var dBCoach = await db.getCoach(dbHandle, coachId);
        if (dBCoach === undefined) {
            console.log("Inserting coach");
            await db.insertCoach(dbHandle, new co.Coach(coachId, 1, isTryout ? 1 : 0, isNormal ? 1 : 0, isReplayAnalysis ? 1 : 0));
        }
        else {
            console.log("updating coach");
            dBCoach.lobbyCount += 1;
            if (isTryout)
                dBCoach.lobbyCountTryout += 1;
            else if (isReplayAnalysis)
                dBCoach.lobbyCountReplayAnalysis += 1;
            else
                dBCoach.lobbyCountNormal += 1;
            await db.updateCoach(dbHandle, dBCoach);
        }
    }
    console.log("Finished saveCoachParticipation");
}
/**
 * Calls db to get coach list sorted by columnName
 * @param {pool} dbHandle
 * @param {string} columnName
 */
async function getCoachList(dbHandle, columnName) {
    return new Promise(function (resolve, reject) {
        db.getSortedCoaches(dbHandle, columnName)
            .then((coaches) => resolve(coaches[0]))
            .catch((err) => reject(err));
    });
}
/**
 * Calls db to get player list sorted by columnName
 * @param {Pool} dbHandle
 * @param {string} columnName
 */
async function getPlayerList(dbHandle, columnName) {
    return new Promise(function (resolve, reject) {
        db.getSortedPlayers(dbHandle, columnName)
            .then((players) => resolve(players[0]))
            .catch((err) => reject(err));
    });
}
/**
 * Calls db to get player list sorted by columnName
 * @param {mysql.Pool} dbHandle
 * @param {String} columnName
 */
async function getReferrerList(dbHandle, columnName = "referralCount") {
    return new Promise(function (resolve, reject) {
        db.getSortedReferrers(dbHandle, columnName)
            .then((referrers) => resolve(referrers[0]))
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
    var referredBy = "", referralLock = 0, lobbyCount = 1;
    for (let i = 0; i < Math.min(users.length, playersPerLobby); i++) {
        var player = await db.getPlayerByID(dbHandle, users[i].id);
        if (player === undefined) {
            await db.insertPlayer(dbHandle, new pl.Player(users[i].id, users[i].tag, referredBy, referralLock, lobbyCount, isUnranked ? 1 : 0, isBotbash ? 1 : 0, is5v5 ? 1 : 0, isReplayAnalysis ? 1 : 0, 0));
        }
        else {
            player.lobbyCount += 1;
            if (isReplayAnalysis)
                player.lobbyCountReplayAnalysis += 1;
            else if (isUnranked)
                player.lobbyCountUnranked += 1;
            else if (is5v5)
                player.lobbyCount5v5 += 1;
            else if (isBotbash)
                player.lobbyCountBotBash += 1;
            await db.updatePlayer(dbHandle, player);
        }
    }
}
module.exports = {
    saveCoachParticipation: saveCoachParticipation,
    savePlayerParticipation: savePlayerParticipation,
    getCoachList: getCoachList,
    getPlayerList: getPlayerList,
    getReferrerList: getReferrerList,
};
