const cM = require("../misc/channelManagement")
const c = require("../misc/constants")
const dB = 			require("../misc/database")
const lM = require("../misc/lobbyManagement")

/**
 * Fetch lobby messages from bot channels on startup
 *
 * @param {Discord.Client} client discord client
 */
module.exports = async (client) => {
    console.log("Ready at " +  new Date().toLocaleString());

	cM.botChannels.forEach(channel => {
        dB.getLobbies(client.dbHandle, channel)
        .then(lobbies => {
            if(lobbies === undefined)
                return;

            lobbies.forEach(lobby => {
                client.guilds.get(process.env.GUILD).channels.get(channel).fetchMessage(lobby.messageId).then(message => {
                    console.log("Fetched lobby message");
                }).catch(error => {
                    console.log(error);
                });
            })
        })
        .catch(err => 
            console.log(err)
        );
    });

    dB.getSchedules(client.dbHandle, '', '')
    .then(schedules => 
    {
        if(schedules === undefined || schedules.length === 0)
            return;
        
        // we have many schedules per messages => only fetch each message once
        fetchedSchedulePosts = [];
        for (let i = 0; i < schedules.length; i++)
        {
            schedule = schedules[i];
            if(fetchedSchedulePosts.find(fetched => fetched.messageId == schedule.messageId && fetched.channelId === schedule.channelId) !== undefined)
                continue;

                fetchedSchedulePosts.push({messageId:schedule.messageId, channelId:schedule.channelId});
        }
        
        fetchedSchedulePosts.forEach(post => {
            // new message in right channel
            client.guilds.get(process.env.GUILD).channels.get(post.channelId).fetchMessage(post.messageId).then(message => {
                console.log("Fetched schedule message");
            }).catch(err => {
                console.log(err)
            });
        });
    })
}