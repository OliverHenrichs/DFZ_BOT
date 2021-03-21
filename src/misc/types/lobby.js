"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lobby = void 0;
/**
 * Just some pod that make up a lobby
 */
class Lobby {
    /**
     * constructor
     * @param {number} type
     * @param {number} date
     * @param {Array<string>} coaches
     * @param {Array<string>} beginnerRoleIds
     * @param {string} regionId
     * @param {string} channelId
     * @param {string} messageId
     */
    constructor(type = -1, date = 0, coaches = [], beginnerRoleIds = [], regionId = "", channelId = "", messageId = "") {
        this.type = type;
        this.date = date;
        this.users = [];
        this.coaches = coaches;
        this.beginnerRoleIds = beginnerRoleIds;
        this.regionId = regionId;
        this.channelId = channelId;
        this.messageId = messageId;
    }
    static fromObject(obj) {
        if (obj == null)
            return;
        var lobby = new Lobby();
        Object.assign(lobby, obj);
        return lobby;
    }
}
exports.Lobby = Lobby;
module.exports = {
    Lobby,
};
