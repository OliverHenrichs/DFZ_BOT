/**
 * Just some pod that make up a lobby
 */
class Lobby {
    /**
     * constructor
     * @param {int} type 
     * @param {string} date 
     * @param {Array<string>} coaches
     * @param {Array<string>} beginnerRoleIds 
     * @param {string} regionId 
     * @param {string} channelId 
     * @param {string} messageId 
     */
    constructor(type=-1, date="", coaches=[], beginnerRoleIds=[], regionId="", channelId="", messageId="") {
        this.type = type
        this.date = date
        this.users = []
        this.coaches = coaches
        this.beginnerRoleIds = beginnerRoleIds
        this.regionId = regionId
        this.channelId = channelId
        this.messageId  = messageId
    };

    static fromObject(obj) {
        if(obj == null)
            return;
        var lobby = new Lobby();
        Object.assign(lobby, obj);
        return lobby;
    };
};

module.exports = {
    Lobby
}