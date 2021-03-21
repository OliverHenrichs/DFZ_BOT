"use strict";
/**
 * Just some pod that make up a player
 */
class Player {
    /**
     * constructor
     * @param {string} userId
     * @param {string} tag
     * @param {string} referredBy
     * @param {number} referralLock
     * @param {number} lobbyCount
     * @param {number} lobbyCountUnranked
     * @param {number} lobbyCountBotBash
     * @param {number} lobbyCount5v5
     * @param {number} lobbyCountReplayAnalysis
     * @param {number} offenses
     */
    constructor(userId = "", tag = "", referredBy = "", referralLock = 0, lobbyCount = 0, lobbyCountUnranked = 0, lobbyCountBotBash = 0, lobbyCount5v5 = 0, lobbyCountReplayAnalysis = 0, offenses = 0) {
        this.userId = userId;
        this.tag = tag;
        this.referredBy = referredBy;
        this.referralLock = referralLock;
        this.lobbyCount = lobbyCount;
        this.lobbyCountUnranked = lobbyCountUnranked;
        this.lobbyCountBotBash = lobbyCountBotBash;
        this.lobbyCount5v5 = lobbyCount5v5;
        this.lobbyCountReplayAnalysis = lobbyCountReplayAnalysis;
        this.offenses = offenses;
    }
    static fromObject(obj) {
        if (obj == null)
            return;
        var player = new Player();
        Object.assign(player, obj);
        return player;
    }
}
module.exports = {
    Player,
};
