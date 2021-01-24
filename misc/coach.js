/**
 * Just some pod that make up a coach
 */
class Coach {
    /**
     * constructor
     * @param {string} userId 
     * @param {int} lobbyCount 
     * @param {int} lobbyCountTryout 
     * @param {int} lobbyCountNormal
     */
    constructor(userId="", lobbyCount=0, lobbyCountTryout=0, lobbyCountNormal=0) {
        this.userId = userId
        this.lobbyCount = lobbyCount
        this.lobbyCountTryout = lobbyCountTryout
        this.lobbyCountNormal = lobbyCountNormal
    };

    static fromObject(obj) {
        if(obj == null)
            return;
        var coach = new Coach();
        Object.assign(coach, obj);
        return coach;
    };
};

module.exports = {
    Coach
}