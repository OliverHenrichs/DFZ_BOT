
const aE = require("./answerEmbedding")
const c = require("./constants")
const cM = require("./channelManagement")
const dB = require("./database")
const Discord = require("discord.js")
const g = require("./generics")
const gM = require("./googleCalendarManagement")
const lM = require("./lobbyManagement")
const s = require("./schedule")
const tZ = require("./timeZone")
const rM = require("./roleManagement")
const scheduleReactionEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

const scheduleTypes = {lobby:"Lobbies", tryout:"Tryouts"};

/**
 * Create header string for weekly schedule
 * @param {JSON} scheduleSetup 
 */
function getWeekScheduleString(scheduleSetup) {
    return "Schedule for Week #" + 
        tZ.getWeekNumber(scheduleSetup.mondayDate) + " in " + (scheduleSetup.mondayDate.getYear()+1900) +
        " ("    + tZ.months[scheduleSetup.mondayDate.getMonth()+1] + " " + scheduleSetup.mondayDate.getDate() +" - "
                + tZ.months[scheduleSetup.sundayDate.getMonth()+1] + " " + scheduleSetup.sundayDate.getDate() +
        ")";
}

/**
 * Creates text for scheduling embedding. All arrays must be equal length
 * @param {Array<int>} days the days on which lobbies are scheduled
 * @param {Array<String>} emojis Which emoji is associated with which schedule
 * @param {string} title title of Schedule
 * @param {Array<String>} times time-strings in format hh:mm'am/pm'
 * @param {string} timezoneName 
 * @param {int} coachCount Number of coaches required for schedule
 */
function getScheduleText(days, emojis, title, times, timezoneName, coachCount) {
    var schedule = {
        name: title,
        value:   "",
        inline: true
    };

    for(let i = 0; i< days.length; i++)
        schedule.value +=   "\n"+emojis[i] + " " + days[i] + " " + times[i] + " " + timezoneName +
                            "\n coach 1: " +
                            (coachCount > 1 ? "\n coach 2: " : "");

    return schedule;
}    

function reactWithScheduleEmojis(message, lastEmojiIndex = -1) {
    for(let idx = 0; idx < (lastEmojiIndex == -1 ? scheduleReactionEmojis.length : lastEmojiIndex); idx++)
        message.react(scheduleReactionEmojis[idx]);
}

/**
 * creates schedule message according to schedule setup
 * @param {Discord.Channel} channel schedule channel
 * @param {JSON} scheduleSetup json containing all information regarding schedule
 */
async function writeSchedule(channel, scheduleSetup) {
    if(scheduleSetup.regions.length !== scheduleSetup.timezones.length || scheduleSetup.regions.length !== scheduleSetup.times.length)
        return undefined;

    var days = [];
    scheduleSetup.days.forEach(day => {
        days.push(tZ.weekDays[day].slice(0, 3));
    });

    var schedules = [];
    var emojiCount = 0;

    for(let i = 0; i < scheduleSetup.regions.length; i++) {
        var regionString = scheduleSetup.regionStrings[i];
        var tz = scheduleSetup.timezoneShortNames[i];

        var emojiStartIndex = i*days.length;
        var emojis = scheduleReactionEmojis.slice(emojiStartIndex, emojiStartIndex+days.length);
        schedules.push(getScheduleText(days, emojis, "**"+ regionString +" " + scheduleSetup.type +"**", scheduleSetup.times, tz, scheduleSetup.coachCount));
        
        emojiCount = emojiStartIndex+days.length;
    }
    
    var footer =    "If a coach or two are signed up, the corresponding lobby is automatically created at least 5h prior to the event." +
                    "\nIf coaches only sign up shortly before the lobby (4h or less), then they must manually create the lobby.";

    var _embed = aE.generateEmbedding(getWeekScheduleString(scheduleSetup), "Sign up as a coach by reacting to the respective number.", footer, schedules);
    var message = await channel.send({embed: _embed});
    reactWithScheduleEmojis(message, emojiCount);

    return message;
}

/**
 * Finds unique schedule identified by message ID and emoji
 * @param {mysql.Connection} dbHandle 
 * @param {string} messageId 
 * @param {string} emojiName 
 */
async function findSchedule(dbHandle, messageId, emojiName) {
    
    var schedules = await dB.getSchedules(dbHandle, messageId, emojiName);
    if(schedules.length === 0)
        return undefined;
    if(schedules.length > 1) {
        console.log("Schedules are not unique ??");
        return undefined;
    }

    return schedules[0];
}

/**
 * Creates a lobby post for due schedule
 * @param {Array<Discord.Channel>} channels channels in which to post the lobby
 * @param {mysql.Connection} dbHandle bot database handle
 * @param {s.Schedule} schedule 
 */
async function createScheduledLobby(channels, dbHandle, schedule) {     
    var lobbyRegionRole = rM.getRegionalRoleFromString(schedule.region);

    var isTryout = schedule.type === scheduleTypes.tryout;
    var isInhouse = (schedule.coachCount === 2  && schedule.coaches.length > 1);
    var type = (isTryout ? c.lobbyTypes.tryout : (isInhouse ? c.lobbyTypes.inhouse : c.lobbyTypes.unranked));

    if(type === c.lobbyTypes.tryout) {
        channel = channels.get(process.env.BOT_LOBBY_CHANNEL_TRYOUT);
        lobbyBeginnerRoles = rM.beginnerRoles.slice(0,1);
    }
    else 
    {
        channel = channels.get(rM.getRegionalRoleLobbyChannel(lobbyRegionRole));
        lobbyBeginnerRoles = rM.beginnerRoles.slice(1,3);
    }

    var timezoneName = rM.getRegionalRoleTimeZoneString(lobbyRegionRole);
    var zonedTime = tZ.getZonedTimeFromTimeZoneName(schedule.date, timezoneName);

    await lM.postLobby(dbHandle, channel, schedule.coaches, type, lobbyBeginnerRoles, lobbyRegionRole, zonedTime);

    // message coaches
    schedule.coaches.forEach(c => {
        channel.guild.fetchMember(c)
        .then(guildMember => guildMember.send("I just posted tonight's "+ schedule.region + " lobby starting *" + tZ.getTimeString(zonedTime) + "*.\nYou are coaching 👍"))
        .catch(err => console.log("error when messaging schedule coaches: " + err))
    })
}

/**
 * Inserts all necessary lobbies, i.e. all lobbies due in the next x hours that havent been posted yet
 * @param {Array<Discord.Channel>} guild 
 * @param {mysql.Connection} dbHandle 
 */
async function insertScheduledLobbies(channels, dbHandle) {
    var schedules = await dB.getSchedules(dbHandle);
    const lobbyPostTime = 60000*60*8; // at the moment 8 hours
    var now = Date.now();

    g.asyncForEach(schedules, async s => {
        if(s.coaches.length === 0) // only post lobbies for which we have coaches
            return;

        var diff = s.date-now; 
        if(diff < 0) // dont post lobbies that are in the past
            return;

        if(diff < lobbyPostTime && !s.lobbyPosted) // dont double post AND only post a couple hours prior to lobby time
        {
            s.lobbyPosted = true; // dont double post
            await createScheduledLobby(channels, dbHandle, s);
            await dB.updateSchedule(dbHandle, s);
        }
    });
}


/**
 * handles how schedules and calendar events react to addition of a coach
 * @param {Discord.Client} client 
 * @param {Discord.MessageReaction} reaction 
 * @param {Discord.User} user 
 * @param {s.Schedule} schedule 
 */
async function handleScheduleCoachAdd(client, reaction, user, schedule) {
    return new Promise(async function(resolve, reject) {
        try {
            await dB.updateSchedule(client.dbHandle, schedule);
            await insertScheduledLobbies(reaction.message.channel.guild.channels, client.dbHandle);
            await module.exports.updateSchedulePost(schedule, reaction.message.channel);
            user.send("✅ Added you as a coach to the scheduled lobby.");
            resolve("Updated schedules")
        } catch (e) {
            reject("Failed updating schedule")
        }
    });
}

/**
 * handles how schedules and calendar events react to coach withdrawal
 * @param {Discord.Client} client 
 * @param {Discord.MessageReaction} reaction 
 * @param {Discord.User} user 
 * @param {s.Schedule} schedule 
 */
async function handleScheduleCoachWithdrawal(client, reaction, user, schedule) {
    return new Promise(async function(resolve, reject) {
        try {
            schedule.eventId = undefined;
            await module.exports.updateSchedulePost(schedule, reaction.message.channel);
            await dB.updateSchedule(client.dbHandle, schedule);
            user.send("✅ Removed you as coach from the scheduled lobby.");
            resolve("Updated schedules")
        } catch (e) {
            reject("Failed updating schedule")
        }
    });
}

module.exports = {
    findSchedule:findSchedule,
    /**
     * Creates the data associated with the created lobby schedules
     * @param {mysql.Connection} dbHandle bot database handle
     * @param {string} messageId the message that is tied to the schedule
     * @param {string} channelId the channel that is tied to the schedule
     * @param {Schedule} scheduleSetup the setup that was used to create the schedule message
     */
    createLobbySchedules: function(dbHandle, messageId, channelId, scheduleSetup) {        
        for(let i = 0; i < scheduleSetup.regions.length; i++)
        {
            var region = scheduleSetup.regions[i];
            var timeZone = scheduleSetup.timezones[i];

            var dayBaseIndex = i*scheduleSetup.days.length;
            for(let j = 0; j < scheduleSetup.days.length; j++)
            {
                var day = scheduleSetup.days[j];
                var time = scheduleSetup.times[j];
                var _date =tZ.getScheduledDate(scheduleSetup.mondayDate, day, time, timeZone);
                if(_date === undefined)
                {
                    console.log("Could not determine scheduled date for " + scheduleSetup);
                    return;
                }
                var reactionEmoji = scheduleReactionEmojis[dayBaseIndex+j];
                dB.insertSchedule(dbHandle, new s.Schedule(
                    channelId,
                    messageId,
                    scheduleSetup.type,
                    scheduleSetup.coachCount,
                    reactionEmoji,
                    _date,
                    region
                ));
            }
        }
    },

    /**
     * update schedule: add additional schedules once on sunday and remove deprecated ones
     * @param {mysql.Connection} dbHandle bot database handle
     * @param {Discord.Collection<string, Discord.GuildChannel>} channels guild channels
     */
    updateSchedules: async function (dbHandle, channels) 
    {
        var now = new Date();
        var day = now.getDay();

        var saved_day = await dB.getDay(dbHandle);

        if(saved_day === day)
            return;
        
        if(isNaN(saved_day))
            res = await dB.insertDay(dbHandle, day);
        else
            res = await dB.updateDay(dbHandle, day);
        
        if(day !== tZ.weekDayNumbers.Sunday)
            return;

        // remove events from the past
        var schedules = await dB.getSchedules(dbHandle);
        var messageIDsToRemove = [];
        for (let i = 0; i< schedules.length; i++)
        {
            var schedule = schedules[i];
            if(messageIDsToRemove.find(messageId => messageId == schedule.messageId) !== undefined)
                continue;

            var scheduleDate = new Date(schedules[i].date);
            if(scheduleDate < now)
                messageIDsToRemove.push(schedule.messageId);
        }
        dB.removeSchedules(dbHandle, messageIDsToRemove);

        // get dates to add (in 4 weeks)
        [monday, sunday] = tZ.getNextMondayAndSundayDate(/*new Date(now.setDate(now.getDate()+21))*/);

        // lobby schedule
        var channel5v5 = channels.find(chan => { return chan.id == cM.scheduleChannel5v5});
        if(channel5v5)
        {
            var scheduleSetup = {
                mondayDate: monday,
                sundayDate: sunday,
                days: [3,5,0], 
                type: scheduleTypes.lobby,
                coachCount: 2,
                regionStrings: tZ.regionStrings,
                regions: tZ.regions,
                times: ["8:00pm", "8:00pm", "4:00pm"],
                timezoneShortNames: tZ.scheduleTimezoneNames_short,
                timezones:tZ.scheduleTimezoneNames
            };
            var msg = await writeSchedule(channel5v5, scheduleSetup);
            this.createLobbySchedules(dbHandle, msg.id, channel5v5.id, scheduleSetup);
        }

        // tryout schedule
        var channelTryout = channels.find(chan => { return chan.id == cM.scheduleChannelTryout});
        if(channelTryout)
        {
            var scheduleSetup = {
                mondayDate: monday,
                sundayDate: sunday,
                days: [2,4,6], 
                type: scheduleTypes.tryout,
                coachCount: 1,
                regionStrings: tZ.regionStrings,
                regions: tZ.regions,
                times: ["8:00pm", "8:00pm", "8:00pm"],
                timezoneShortNames: tZ.scheduleTimezoneNames_short,
                timezones:tZ.scheduleTimezoneNames
            };
            var msg = await writeSchedule(channelTryout, scheduleSetup);
            this.createLobbySchedules(dbHandle, msg.id, channelTryout.id, scheduleSetup);
        }
    },

    /**
     * Update schedule to account for changes in coaches
     * @param {JSON} schedule schedule that changed
     * @param {Discord.Channel} channel channel in which the schedule was posted
     */
    updateSchedulePost: async function(schedule, channel) {
        // fetch message
        const message = await channel.fetchMessage(schedule.messageId);
        if(message === undefined || message === null)
            return;

        // generate new embed
        var old_embed = message.embeds[0];
        for(let i = 0; i< old_embed.fields.length; i++)
        {
            var field = old_embed.fields[i];
            if(field.value.indexOf(schedule.emoji) === -1)
                continue;

            var lines = field.value.split('\n');
            for(let j = 0; j < lines.length; j++)
            {
                var line = lines[j];
                if(line.indexOf(schedule.emoji) === -1 || j+schedule.coachCount >= lines.length)
                    continue;

                // coach change
                lines[j+1] = "coach 1: " + (schedule.coaches.length > 0 ? ("<@" + schedule.coaches[0] + ">") : "");
                if(schedule.coachCount > 1)
                    lines[j+2] = "coach 2: " + (schedule.coaches.length > 1 ? ("<@" + schedule.coaches[1] + ">") : "");
                
                var new_embed = new Discord.RichEmbed(old_embed);
                new_embed.fields[i].value = lines.join('\n');

                // update embed
                await message.edit(new_embed);
                return;
            }
        }
    },

    /**
     * Checks if user is coach in schedule, and if yes, removes them.
     * Then updates the schedules / google events to reflect this
     * @param {Discord.Client} client discord client (fetching users for rewriting schedule google calendar event)
     * @param {Discord.MessageReaction} reaction determines which schedule we update
     * @param {Discord.User} user the guy who removed the reaction
     */
    removeCoachFromSchedule: async function(client, reaction, user) {
        var schedule = await findSchedule(client.dbHandle, reaction.message.id, reaction.emoji.name);

        var idx = schedule.coaches.findIndex(coach => coach === user.id);
        if(idx === -1)
            return;
            
        // remove coach
        schedule.coaches.splice(idx, 1);
        
        // update google event
        gM.editCalendarEvent(schedule, client)
        .then(eventId => {
            // update schedule 
            handleScheduleCoachWithdrawal(client, reaction, user, schedule)
        }).catch(err => 
        {
            // if we have no calendar or google api fails with 'Resource has been deleted' or 'not found' aka the event is already gone, then still remove coach from schedule
            if(err === gM.noCalendarRejection || err.code === 410 || err.code === 404) 
            {
                handleScheduleCoachWithdrawal(client, reaction, user, schedule);
            } else {
                console.log(err);
                user.send("⛔ Could not remove you from the schedule. Maybe hit a rate-limit in GoogleCalendar. Try again in 5s.");
            }  
        });
    }, 

    /**
     * Checks if user is coach in schedule, and if not, adds them.
     * Then updates the schedules / google events to reflect this
     * @param {Discord.Client} client discord client (fetching users for rewriting schedule google calendar event)
     * @param {Discord.MessageReaction} reaction determines which schedule we update
     * @param {Discord.User} user the guy who removed the reaction
     */
    addCoach: async function(client, reaction, user) {
        // get guild member (has role)
        const guildMember = await reaction.message.channel.guild.fetchMember(user.id);

        // get role
        var role = rM.findRole(guildMember, rM.adminRoles);
        if(role === undefined || role === null) {
            user.send("⛔ You cannot interact because you are not a coach.");
            return;
        }
        
        var schedule = await findSchedule(client.dbHandle, reaction.message.id, reaction.emoji.name);
        
        if(schedule.coaches.find(coach => coach === user.id))
        {
            user.send("⛔ You are already coaching that lobby.");
            return;
        }
        
        schedule.coaches.push(user.id);
        
        var creationHandler = () => {
            if(schedule.eventId === undefined ||schedule.eventId === "No Calendar")
                return gM.createCalendarEvent(schedule, client)
            else
                return gM.editCalendarEvent(schedule, client)
        }

        creationHandler()
        .then((eventId) => {            
            schedule.eventId = eventId;
            return handleScheduleCoachAdd(client, reaction, user, schedule);
        }).catch((err) => {
            if(err === gM.noCalendarRejection)
                return handleScheduleCoachAdd(client, reaction, user, schedule);

            console.log(err);
            user.send("⛔ Could not create an event in gcalendar for you. Maybe hit a rate-limit. Try again in 5s.");
        })
    },
    insertScheduledLobbies:insertScheduledLobbies
}