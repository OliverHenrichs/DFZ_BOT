
const aE = require("./answerEmbedding")
const cM = require("./channelManagement")
const gM = require("./googleCalendarManagement")
const Discord = require("discord.js")
const _tz = require("./timeZone")
const rM = require("./roleManagement")
const scheduleReactionEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

function getWeekScheduleString(scheduleSetup)
{
    return "Schedule for Week #" + 
        _tz.getWeekNumber(scheduleSetup.mondayDate) + " in " + (scheduleSetup.mondayDate.getYear()+1900) +
        " ("    + _tz.months[scheduleSetup.mondayDate.getMonth()+1] + " " + scheduleSetup.mondayDate.getDate() +" - "
                + _tz.months[scheduleSetup.sundayDate.getMonth()+1] + " " + scheduleSetup.sundayDate.getDate() +
        ")";
}

function getScheduleText(days, emojis, title, times, timezoneName, coachCount)
{
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

function reactWithScheduleEmojis(message, lastEmojiIndex = -1)
{
    for(let idx = 0; idx < (lastEmojiIndex == -1 ? scheduleReactionEmojis.length : lastEmojiIndex); idx++)
        message.react(scheduleReactionEmojis[idx]);
}

/**
 * creates schedule message according to schedule setup
 * @param {*} channel schedule channel
 * @param {*} scheduleSetup struct containing all information regarding schedule
 */
async function writeSchedule(channel, scheduleSetup)
{
    if(scheduleSetup.regions.length !== scheduleSetup.timezones.length || scheduleSetup.regions.length !== scheduleSetup.times.length)
        return undefined;

    var days = [];
    scheduleSetup.days.forEach(day => {
        days.push(_tz.weekDays[day].slice(0, 3));
    });

    var schedules = [];
    var emojiCount = 0;

    for(let i = 0; i < scheduleSetup.regions.length; i++)
    {
        var regionString = scheduleSetup.regionStrings[i];
        var tz = scheduleSetup.timezoneShortNames[i];

        var emojiStartIndex = i*days.length;
        var emojis = scheduleReactionEmojis.slice(emojiStartIndex, emojiStartIndex+days.length);
        schedules.push(getScheduleText(days, emojis, "**"+ regionString +" " + scheduleSetup.type +"**", scheduleSetup.times, tz, scheduleSetup.coachCount));
        
        emojiCount = emojiStartIndex+days.length;
    }
    
    var footer = "";
    if(scheduleSetup.coachCount === 1)
        footer = "If a coach is signed up, then they must create the corresponding lobby at least 3h prior to the event.";
    else 
        footer = "If two coaches are signed up, then one coach must create the corresponding lobby at least 3h prior to the event.\nIf only one coach is signed up, then they can choose to e.g. offer an unranked lobby.";

    var _embed = aE.generateEmbedding(getWeekScheduleString(scheduleSetup), "Sign up as a coach by reacting to the respective number.", footer, schedules);
    var message = await channel.send({embed: _embed});
    reactWithScheduleEmojis(message, emojiCount);

    return message;
}

function findSchedule(schedules, messageId, emojiName) {
    return schedules.find(schedule => {
        return schedule.message === messageId && schedule.emoji === emojiName;
    })
}

module.exports = {
    /**
     * Creates the data associated with the created lobby schedules
     * @param {*} state client state
     * @param {*} msg the message that is tied to the schedule
     * @param {*} scheduleSetup the setup that was used to create the schedule message
     */
    createLobbySchedules: function(state, msg, scheduleSetup)
    {
        if(state.schedules === undefined)
            state.schedules = [];
        
        for(let i = 0; i< scheduleSetup.regions.length; i++)
        {
            var region = scheduleSetup.regions[i];
            var tz = scheduleSetup.timezones[i];

            var dayBaseIndex = i*scheduleSetup.days.length;
            for(let j = 0; j < scheduleSetup.days.length; j++)
            {
                var day = scheduleSetup.days[j];
                var time = scheduleSetup.times[j];
                var _date =_tz.getScheduledDate(scheduleSetup.mondayDate, day, time, tz);
                if(_date === undefined)
                {
                    console.log("Could not determine scheduled date for " + scheduleSetup);
                    return;
                }
                var reactionEmoji = scheduleReactionEmojis[dayBaseIndex+j];
                state.schedules.push({
                    message: msg.id,
                    type: scheduleSetup.type,
                    coachCount: scheduleSetup.coachCount,
                    emoji: reactionEmoji,
                    date: _date,
                    region: region,
                    coaches: []
                });
            }
        }
    },

    /**
     * update schedule: add additional schedules once on sunday and remove deprecated ones
     * @param {*} state client state
     * @param {*} channels guild channels
     */
    updateSchedules: async function (state, channels) 
    {
        var now = new Date();
        var day = now.getDay();

        if(state.day === day)
            return;
            
        state.day = day;
        
        if(day !== 0) // only act on sunday
            return;

        // remove events from the past
        for(let i = state.schedules.length-1; i>=0; i--)
        {
            var scheduleDate = new Date(state.schedules[i].date);
            if(scheduleDate < now)
            {
                state.schedules.splice(i, 1);
            }
        }

        // get dates to add (in 4 weeks)
        [monday, sunday] = _tz.getNextMondayAndSundayDate(/*new Date(now.setDate(now.getDate()+21))*/);

        // lobby schedule
        var channel5v5 = channels.find(chan => { return chan.id == cM.scheduleChannel5v5});
        if(channel5v5)
        {
            var scheduleSetup = {
                mondayDate: monday,
                sundayDate: sunday,
                days: [3,5,0], 
                type: "Lobbies",
                coachCount: 2,
                regionStrings: _tz.regionStrings,
                regions: _tz.regions,
                times: ["8:00pm", "8:00pm", "4:00pm"],
                timezoneShortNames: _tz.scheduleTimezoneNames_short,
                timezones:_tz.scheduleTimezoneNames
            };
            var msg = await writeSchedule(channel5v5, scheduleSetup);
            this.createLobbySchedules(state, msg, scheduleSetup);
        }

        // tryout schedule
        var channelTryout = channels.find(chan => { return chan.id == cM.scheduleChannelTryout});
        if(channelTryout)
        {
            var scheduleSetup = {
                mondayDate: monday,
                sundayDate: sunday,
                days: [2,4,6], 
                type: "Tryouts",
                coachCount: 1,
                regionStrings: _tz.regionStrings,
                regions: _tz.regions,
                times: ["8:00pm", "8:00pm", "8:00pm"],
                timezoneShortNames: _tz.scheduleTimezoneNames_short,
                timezones:_tz.scheduleTimezoneNames
            };
            var msg = await writeSchedule(channelTryout, scheduleSetup);
            this.createLobbySchedules(state, msg, scheduleSetup);
        }
    },

    /**
     * Update schedule to account for changes in coaches
     * @param {*} schedule schedule that changed
     * @param {*} channel channel in which the schedule was posted
     */
    updateSchedulePost: async function(schedule, channel) {
        // fetch message
        const message = await channel.fetchMessage(schedule.message);
        if(message === undefined || message === null)
            return;

        // generate new embed
        var old_embed = message.embeds[0];
        for(let i = 0; i< old_embed.fields.length; i++)
        {
            var field = old_embed.fields[i];

            if(field.value.indexOf(schedule.emoji) !== -1)
            {
                var lines = field.value.split('\n');
                for(let j = 0; j < lines.length; j++)
                {
                    var line = lines[j];
                    if(line.indexOf(schedule.emoji) !== -1 && j+schedule.coachCount < lines.length)
                    {
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
            }
        }
    },

    /**
     * Checks if user is coach in schedule, and if yes, removes them.
     * Then updates the schedules / google events to reflect this
     * @param {*} client discord client (fetching users for rewriting schedule google calendar event)
     * @param {*} reaction determines which schedule we update
     * @param {*} user the guy who removed the reaction
     */
    removeCoachFromSchedule: function(client, reaction, user)
    {
        var schedule = findSchedule(client._state.schedules, reaction.message.id, reaction.emoji.name);
        var idx = schedule.coaches.findIndex(coach => coach === user.id);
        if(idx !== -1)
        { 
            schedule.coaches.splice(idx, 1);
            this.updateSchedulePost(schedule, reaction.message.channel);
            gM.editCalendarEvent(schedule, client);
        }   
    }, 

    /**
     * Checks if user is coach in schedule, and if not, adds them.
     * Then updates the schedules / google events to reflect this
     * @param {*} client discord client (fetching users for rewriting schedule google calendar event)
     * @param {*} reaction determines which schedule we update
     * @param {*} user the guy who removed the reaction
     */
    addCoachToSchedule: async function(client, reaction, user)
    {
        // get guild member (has role)
        const guildMember = await reaction.message.channel.guild.fetchMember(user.id);

        // get role
        var role = rM.findRole(guildMember, rM.adminRoles);
        if(role === undefined || role === null) {
            user.send("⛔ You cannot interact because you are not a coach.");
            return;
        }

        var schedule = findSchedule(client._state.schedules, reaction.message.id, reaction.emoji.name);
        var idx = schedule.coaches.findIndex(coach => coach === user.id);
        if(idx === -1)
        {
            schedule.coaches.push(user.id);
            this.updateSchedulePost(schedule, reaction.message.channel);
            if (schedule.coaches.length === schedule.coachCount)
                if(schedule.event_ID === undefined)
                    gM.createCalendarEvent(schedule, client);
                else
                    gM.editCalendarEvent(schedule, client);
        }
    }
}