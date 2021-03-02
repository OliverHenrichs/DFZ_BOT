const cM = require("../misc/channelManagement")
const dB = require("../misc/database")
const lM = require("../misc/lobbyManagement")
const sM = require("../misc/scheduleManagement")

function getUniqueSchedulePosts(schedules) {
    var fetchedSchedulePosts = [];

    for (const schedule of schedules) {
        containsPost = fetchedSchedulePosts.find(fetched => fetched.messageId == schedule.messageId && fetched.channelId === schedule.channelId) !== undefined;
        if(containsPost)
            continue;

        fetchedSchedulePosts.push({messageId:schedule.messageId, channelId:schedule.channelId});
    }

    return fetchedSchedulePosts;
}

/**
 * Fetch lobby messages from bot channels on startup
 * and setup all interval tasks
 *
 * @param {Discord.Client} client discord client
 */
module.exports = async (client) => {
    console.log("Ready at " +  new Date().toLocaleString());
    try {
        var guild = await client.guilds.fetch(process.env.GUILD)
        for (const channel of cM.lobbyChannels) {
            var lobbies = await dB.getLobbies(client.dbHandle, channel);
            
            if(lobbies.length === 0 || lobbies === [] || lobbies === undefined)
                continue;

            var gc = guild.channels.cache.find(chan => chan.id === channel);
            for (const lobby of lobbies) {
                await gc.messages.fetch(lobby.messageId);
            }
        }
    } catch {(err) => 
        console.log(err);
    }

    dB.getSchedules(client.dbHandle, '', '')
    .then(schedules => new Promise(async function(resolve) {

        if(schedules === undefined || schedules.length === 0) {
            resolve();
            return;
        }
        
        // we have many schedules per messages => only fetch each message once
        var fetchedSchedulePosts = getUniqueSchedulePosts(schedules);

        var guild = await client.guilds.fetch(process.env.GUILD);
        try{
            for (const post of fetchedSchedulePosts) {
                var gc = guild.channels.cache.find(chan => chan.id === post.channelId);
                gc.messages.fetch(post.messageId);
            }
        } catch {(err) => 
            console.log(err);
        }

        resolve();
    })).then(() => new Promise(async function(resolve) {
        // update lobby posts
        const timeUpdater = async () => {
            try{
                var guild = await client.guilds.fetch(process.env.GUILD);
                if(guild === undefined || guild === null)
                    return;
                await lM.updateLobbyTimes(guild, client.dbHandle);
            } catch {(err) => 
                console.log(err);
            }
        };
        await timeUpdater();
        setInterval(timeUpdater, 60000); // once per minute

        // update lobby schedule 
        const scheduleWriter = async () => {
            
            var guild = await client.guilds.fetch(process.env.GUILD);
            if(guild === undefined || guild === null)
                return;
            sM.updateSchedules(client.dbHandle, guild.channels);
        }
        await scheduleWriter();
        
        setInterval(scheduleWriter, 60*60000); // once per hour

        // post lobbies from schedule
        const lobbyPoster = async () => {
            var guild = await client.guilds.fetch(process.env.GUILD);
            if(guild === undefined || guild === null)
                return;
            await sM.insertScheduledLobbies(guild.channels, client.dbHandle);
        }
        await lobbyPoster();
        setInterval(lobbyPoster, 60*60000); // once per hour

        resolve("Interval tasks set");
    }))
}