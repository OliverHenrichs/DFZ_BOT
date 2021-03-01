/**
 * Just some pod that make up a player
 */
class Player {
    /**
     * constructor
     * @param {string} userId 
     * @param {string} tag
     * @param {string} referredBy 
     * @param {boolean} referralLock 
     * @param {int} referralCount 
     * @param {int} lobbyCount 
     * @param {int} lobbyCountUnranked
     * @param {int} lobbyCountBotBash
     * @param {int} lobbyCount5v5
     * @param {int} lobbyCountReplayAnalysis
     * @param {int} offenses
     */
    constructor(userId = "", tag = "", referredBy = "", referralLock = 0, referralCount = 0, lobbyCount = 0, lobbyCountUnranked = 0, lobbyCountBotBash = 0, lobbyCount5v5 = 0, lobbyCountReplayAnalysis = 0, offenses = 0) {
        this.userId = userId
        this.tag = tag
        this.referredBy = referredBy
        this.referralLock = referralLock
        this.referralCount = referralCount
        this.lobbyCount = lobbyCount
        this.lobbyCountUnranked = lobbyCountUnranked
        this.lobbyCountBotBash = lobbyCountBotBash
        this.lobbyCount5v5 = lobbyCount5v5
        this.lobbyCountReplayAnalysis = lobbyCountReplayAnalysis
        this.offenses = offenses
    };

    static fromObject(obj) {
        if (obj == null)
            return;
        var player = new Player();
        Object.assign(player, obj);
        return player;
    };
};

module.exports = {
    Player
}