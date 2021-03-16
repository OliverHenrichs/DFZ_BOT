/**
 * Just some pod that make up a schedule
 */
class Schedule {
    channelId: string;
    messageId: string;
    type: number;
    coachCount: number;
    emoji: string;
    date: string;
    region: string;
    coaches: any[];
    lobbyPosted: boolean;
    
    /**
     * constructor
     * @param {string} channelId
     * @param {string} messageId
     * @param {number} type
     * @param {number} coachCount
     * @param {string} emoji
     * @param {string} date
     * @param {string} region
     */
    constructor(channelId: string = "", messageId: string = "", type: number = -1, coachCount: number = 0, emoji: string = "", date: string = "", region: string = "") {
        this.channelId = channelId;
        this.messageId = messageId;
        this.type = type;
        this.coachCount = coachCount;
        this.emoji = emoji;
        this.date = date;
        this.region = region;
        this.coaches = [];
        this.lobbyPosted = false;
    }

    static fromObject(obj: any) {
        if (obj == null)
            return;
        var schedule: Schedule = new Schedule();
        Object.assign(schedule, obj);
        return schedule;
    }
}
module.exports = {
    Schedule,
};
