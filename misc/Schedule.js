/**
 * Just some pod that make up a schedule
 */
class Schedule {
    /**
     * constructor
     * @param {string} channelId 
     * @param {string} messageId 
     * @param {int} type 
     * @param {int} coachCount 
     * @param {string} emoji 
     * @param {string} date 
     * @param {string} region 
     */
    constructor(channelId="", messageId="", type=-1, coachCount=0, emoji="", date="", region="")
    {
        this.channelId = channelId;
        this.messageId = messageId;
        this.type = type;
        this.coachCount = coachCount;
        this.emoji = emoji;
        this.date = date;
        this.region = region;
        this.coaches = [];
        this.lobbyPosted = false;
    };

    static fromObject(obj)
    {
        if(obj == null)
            return;
        var schedule = new Schedule();
        Object.assign(schedule, obj);
        return schedule;
    };
};

module.exports = {
    Schedule
}