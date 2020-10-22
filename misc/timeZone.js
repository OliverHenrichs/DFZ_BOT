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
 * @param {*} timezoneName 
 */
async function findTimeZone(timezoneName)
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
        var zone = await tZ.findTimeZone(timezoneName);
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
    
    createLobbyTime: async function(time, timezoneName) {
        // get time
        [hour, minute] = validateTime(time);
        if(hour === undefined || minute === undefined)
            return [false, undefined, timezoneName, "you need to provide a valid time (e.g. 9:30pm, 6:04am, ...) in your post"];

        // get time zone
        [zone, error] = await findTimeZone(timezoneName);
        if(zone === undefined)
            return [false, undefined, timezoneName, error];

        // get 'now'
        var date = new Date();
        // get 'now' in timezone
        var zonedDate = await tZ.getZonedTime(date, zone);
        // check if hour, minute has already past in their time zone
        var timeDif = (hour - zonedDate.hours)*1000*60*60 + (minute - zonedDate.minutes)*1000*60;
        if(timeDif < 0) // go for next day if it did
            timeDif = dayInMs + timeDif;

        // create date "in milliseconds since 01.01.1970 00:00"
        var lobbyDate = new Date(zonedDate.epoch + timeDif);
        
        // return zoned lobby date
	    var zonedLobbyDate = await tZ.getZonedTime(lobbyDate, zone);
        return [true, zonedLobbyDate, timezoneName, ""];
    },

    getUserLobbyTime: async function(date, timezoneName) 
    {
        var error =""
        try {
            // find user zone
            [userzone, error] = await findTimeZone(timezoneName)
            if(userzone == undefined)
                return;

            // calculate zoned time 
            var zonedtime = await tZ.getZonedTime(date, userzone)
        } catch(err) {
            error = err.message;
        };
        if(error == "")
            return [true, getTimeString(zonedtime) + " " + timezoneName]

        return [false, error]
    },

    getZonedTime: async function(date, timezone) {
        return await tZ.getZonedTime(date, timezone)
    }, 

    getTimeString: getTimeString
}