const tZ = require('timezone-support')

const weekDays = {  1:"Monday", 
                    2:"Tuesday", 
                    3:"Wednesday", 
                    4:"Thursday", 
                    5:"Friday", 
                    6:"Saturday", 
                    7:"Sunday" }

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
    if(l != 3 && l != 4)
        return undefined;

    // check hour
    var hour = -1;
    var ampm ="";
    if (l == 3)
    {
        hour = parseInt(timeString[0], 10)
        ampm = timeString.substring(1,3);
    } else {
        hour = parseInt(timeString.substring(0, 2))
        ampm = timeString.substring(2,4);
    }
    if((hour == NaN || hour < 0 || hour > 12) || (ampm != "am" && ampm != "pm"))
        return undefined;

    if(ampm != "pm" || hour == 12)
        timeString = hour;
    else 
        timeString = hour+12;
    
    return timeString;
}

Date.prototype.addMinutes = function(h) {
    this.setTime(this.getTime() + (h*60*1000));
    return this;
}

module.exports = {
    weekDays: weekDays,
    months:months,
    
    createLobbyTime: async function(time, timezone) {
        // get time
        var _time = validateTime(time);
        if(_time == undefined)
        {
            return [false, undefined, "you need to provide a valid full hour time (e.g. 9pm, 6am, ...) in your post"];
        }

        // get timezone
        var changed = false;
        if(timezone.startsWith("GMT")) {
            changed = true;
            var original = timezone;
            timezone = "Etc/" + timezone;
        }
        var res = true;
        var error = "";
        try {
            var zone = await tZ.findTimeZone(timezone);
        } catch(err) {
            res = false;
            error = err.message;
        };
        if(!res)
            return [false, undefined, error];

        /*
         * following is a crude hack because Date()'s locale screws with timezone-support
         * artificially creating a time that fits the 
        */

        // use today's date
        var date = new Date();

        // get offset to user's time zone
        var tZoffset = tZ.getUTCOffset(date, zone);
        if(changed) { // fix time zone name for GMT+x
            tZoffset.abbreviation = original;
        }

        // add offset hour to get time of author
        date.addMinutes(-tZoffset.offset);

        // check if time is in the past
        if(date.getHours() > _time)
            return [false, undefined, "Time is in the past, it is now " + date.toLocaleString()]
        
        // create date at wanted UTC time (user time + user time offset)
        var actualDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), _time+tZoffset.offset/60, 0, 0, 0));

        // convert to timezone-support::time
        var shortDate = tZ.convertDateToTime(actualDate);
        // fix the time zone ...
        shortDate.zone = tZoffset;
        // and the hour value
        shortDate.hours = _time;

        return [true, shortDate, ""];
    },

    getUserLobbyTime: async function(date, timezone) {
        
        var error =""
        try {
            // find user zone
            const userzone = await tZ.findTimeZone(timezone)
            // calculate zoned time
            var unixTime = await tZ.getUnixTime(date)
            var bla = new Date(unixTime);
            var zonedtime = await tZ.getZonedTime(unixTime, userzone)
        } catch(err) {
            error = err.message;
        };
        if(error == "")
            return [true, weekDays[zonedtime.dayOfWeek] + ", " + zonedtime.hours + ":00 " + timezone]

        return [false, error]
    }
}