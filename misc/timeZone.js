const tZ = require('timezone-support')

const weekDays = {  
    0:"Sunday",
    1:"Monday", 
    2:"Tuesday", 
    3:"Wednesday", 
    4:"Thursday", 
    5:"Friday", 
    6:"Saturday"
}

const months = {
    1:"Jan",
    2:"Feb",
    3:"Mar",
    4:"Apr",
    5:"May",
    6:"Jun",
    7:"Jul",
    8:"Aug",
    9:"Sep",
    10:"Oct",
    11:"Nov",
    12:"Dec"
}

// get current time zone short names (daylight savings time vs normal time)
const regions = ['EU', 'NA', 'SEA'];
const regionStrings =  ["🇪🇺 EU", "🇺🇸 NA", "🌏 SEA"];
const scheduleTimezoneNames = ["Europe/Berlin", "America/New_York", "Asia/Singapore"];

const scheduleTimezoneNames_short = getTimeZoneShortNames(scheduleTimezoneNames);

function getTimeZoneShortNames(timezoneNames)
{
    var date = Date.now();
    var timezoneShortNames = [];
    timezoneNames.forEach(name => {
        // get time zone
        [zone, error] = findTimeZone(name);
        if(zone === undefined)
            return undefined;
            
        // get correct time zone abbreviation
        var abbr = tZ.getUTCOffset(date, zone).abbreviation;
        if(abbr === "+08")
            abbr = "SGT";
        else if(abbr[0] == '+' || abbr[1] == '-')
            abbr = "GMT"+abbr;
        timezoneShortNames.push(abbr);
    });
    return timezoneShortNames;
}


/**
 * Validates that time string has form xxam, xam, xpm xxpm (x in 0,..,9)
 * @param {string} timeString input string
 * @return true if validator succeeds
 */
function validateTime(timeString)
{
    // check length
    var l = timeString.length;
    if(l != 6 && l != 7)
        return [undefined, undefined];

    // check hour
    var hour = -1;
    var ampm ="";
    if (l == 6)
    {
        hour = parseInt(timeString[0])
        minute = parseInt(timeString.substring(2, 4))
        ampm = timeString.substring(4);
    } else {
        hour = parseInt(timeString.substring(0, 2))
        minute = parseInt(timeString.substring(3, 5))
        ampm = timeString.substring(5);
    }
    if((isNaN(hour) || isNaN(minute)) || (ampm != "am" && ampm != "pm") || (hour < 0 || hour > 12) || (minute < 0 || minute > 59))
        return [undefined, undefined];

    if(ampm === "am")
    {
        if(hour === 12)
            return [hour-12, minute]; // 12:30 am => 00:30
        else 
            return [hour, minute]; // 1am = 1:00, 10am = 10:00
    } else {
        if(hour === 12)
            return [hour, minute]; // 12:30pm = 12:30
        else
            return [hour+12, minute]; // 1:00pm = 13:00, 11pm = 23:00
    } 
}

/**
 * gets time zone from time zone name
 * @param {string} timezoneName 
 */
function findTimeZone(timezoneName)
{
    /*
    * POSIX-Definition causes GMT+X to be GMT-X and vice versa... 
    * In order to not confuse the user we exchange + and - here ;-)
    */
    if(timezoneName.startsWith("GMT")) 
    {
        if(timezoneName.length>4)
        {
            var sign = timezoneName[3];
            if(sign == "+")
                timezoneName = "Etc/GMT-" + timezoneName.substr(4);
            else if(sign == "-")
                timezoneName = "Etc/GMT+" + timezoneName.substr(4);
        } else {
            timezoneName = "Etc/" + timezoneName;
        }
    }
    
    var res = true;
    var error = "";
    try {
        var zone = tZ.findTimeZone(timezoneName);
    } catch(err) {
        res = false;
        error = err.message;
    };
    if(!res)
        return [undefined, error];

    return [zone, ""];
}

function getTimeString(zonedTime)
{
    return weekDays[zonedTime.dayOfWeek] + ", "+ months[zonedTime.month] +" "+ zonedTime.day + " at " + zonedTime.hours + ":" + (zonedTime.minutes < 10 ? "0"+ zonedTime.minutes : zonedTime.minutes);
}

const dayInMs = 24*1000*60*60;

module.exports = {
    weekDays: weekDays,
    months:months,

    regions:regions,
    regionStrings:regionStrings,
    scheduleTimezoneNames:scheduleTimezoneNames,
    scheduleTimezoneNames_short:scheduleTimezoneNames_short,

    /**
     * self-explanatory...
     * @param {string} region 
     */
    getTimeZoneStringFromRegion: function(_region)
    {
        var idx = regions.findIndex(region => {return region === _region});
        if(idx === -1)
            return scheduleTimezoneNames[0];

        return scheduleTimezoneNames[idx];
    },

    /**
     * Thx @ https://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php
     * @param {Date} date 
     */
    getWeekNumber: function(date){
        var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        var dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
    },

    /**
     * Thx @ https://stackoverflow.com/questions/4156434/javascript-get-the-first-day-of-the-week-from-current-date
     * Returns the dates for given date's next week's monday and sunday
     * @param {Date} date date from which on we want next monday and tuesday
     */
    getNextMondayAndSundayDate: function(date=undefined) {
        var now = date === undefined ? new Date() : date;
        var day = now.getDay(),
            diffToMondayNextWeek = now.getDate() - day + (day == 0 ? 1 : 8),
            diffToSundayOfNextWeek = diffToMondayNextWeek + 6;
 
        return [new Date(now.setDate(diffToMondayNextWeek)), new Date(now.setDate(diffToSundayOfNextWeek))];
    },

    getTimeZoneShortNames: getTimeZoneShortNames,

    /**
     * 
     * @param {date} mondayDate start date of the schedule week
     * @param {int} day week day of schedule
     * @param {string} timeString time of schedule
     * @param {string} timezoneName time zone name
     */
    getScheduledDate: function(mondayDate, day, timeString, timezoneName) {
        [hour, minute] = validateTime(timeString);

        // get time zone
        [zone, error] = findTimeZone(timezoneName);
        if(zone === undefined)
            return undefined;

        // set date
        var scheduledDate = new Date(mondayDate);
        var newDate = scheduledDate.getDate() + (day == 0 ? 6 : (day-1));
        scheduledDate.setDate(newDate);
        scheduledDate.setHours(hour);
        scheduledDate.setMinutes(minute-scheduledDate.getTimezoneOffset()); // remove time zone offset of server, offset given in minutes
        //var utcDate = Date.UTC(scheduledDate.getUTCFullYear(), scheduledDate.getUTCMonth(), scheduledDate.getUTCDate(), scheduledDate.getUTCHours(), scheduledDate.getUTCMinutes(), scheduledDate.getUTCSeconds(), scheduledDate.getUTCMilliseconds());
        // transform into correct time zone
        var scheduledDateZoned = tZ.setTimeZone(scheduledDate, zone, {useUTC:true});

        //var diff = (scheduledDateZoned.epoch - utcDate)/1000;
        return scheduledDateZoned.epoch;
    },

    /**
     * use user given time to derive a UTC time for lobby
     * @param {string} time time string 
     * @param {string} timezoneName timezone name 
     */
    createLobbyTime: function(time, timezoneName) {
        // get time
        [hour, minute] = validateTime(time);
        if(hour === undefined || minute === undefined)
            return [false, undefined, timezoneName, "you need to provide a valid time (e.g. 9:30pm, 6:04am, ...) in your post"];

        // get time zone
        [zone, error] = findTimeZone(timezoneName);
        if(zone === undefined)
            return [false, undefined, timezoneName, error];

        // get 'now'
        var date = new Date();
        // get 'now' in timezone
        var zonedDate = tZ.getZonedTime(date, zone);
        // check if hour, minute has already past in their time zone
        var timeDif = (hour - zonedDate.hours)*1000*60*60 + (minute - zonedDate.minutes)*1000*60;
        if(timeDif < 0) // go for next day if it did
            timeDif = dayInMs + timeDif;

        // create date "in milliseconds since 01.01.1970 00:00"
        var lobbyDate = new Date(zonedDate.epoch + timeDif);
        
        // return zoned lobby date
	    var zonedLobbyDate = tZ.getZonedTime(lobbyDate, zone);
        return [true, zonedLobbyDate, ""];
    },

    /**
     * 
     * @param {Date} date 
     * @param {tZ.timezone} timezone 
     */
    getZonedTime: function(date, timezone) {
        return tZ.getZonedTime(date, timezone)
    }, 

    /**
     * Returns time in given time zone if time zone name is being recognized
     * @param {Date} date 
     * @param {string} timezoneName 
     * @return {tZ.Time} zoned time
     */
    getZonedTimeFromTimeZoneName: function(date, timezoneName) {
        [zone, error] = findTimeZone(timezoneName);
        
        if(zone === undefined)
            return error;

        return tZ.getZonedTime(date, zone)
    }, 

    getTimeString: getTimeString
}