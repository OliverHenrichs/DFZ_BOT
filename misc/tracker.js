const c = require("../misc/constants")
const co = require("../misc/coach")
const db = require("../misc/database")

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

    coaches.forEach((coachId)=> {
        db.getCoach(dbHandle, coachId)
        .then(dBCoach => {
            if(dBCoach === undefined) {
                db.insertCoach(dbHandle, new co.Coach(coachId, 1, (isTryout? 1 : 0), (isNormal? 1 : 0), (isReplayAnalysis? 1 : 0)));
            } else {
                dBCoach.lobbyCount += 1;

                if(isTryout)
                    dBCoach.lobbyCountTryout += 1;
                else if(isReplayAnalysis)
                    dBCoach.lobbyCountReplayAnalysis += 1;
                else 
                    dBCoach.lobbyCountNormal += 1;

                db.updateCoach(dbHandle, dBCoach);
            }
        })
    });
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

module.exports = {
    saveCoachParticipation: saveCoachParticipation,
    getCoachList: getCoachList
}