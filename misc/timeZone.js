const tZ = require('timezone-support')

const weekDays = {  1:"Monday", 
                    2:"Tuesday", 
                    3:"Wednesday", 
                    4:"Thursday", 
                    5:"Friday", 
                    6:"Saturday", 
                    7:"Sunday" }

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

module.exports = {
    createLobbyTime: async function(time, timezone) {
        // get time
        var _time = validateTime(time);
        if(_time == undefined)
        {
            return [false, undefined, undefined, "you need to provide a valid full hour time (e.g. 9pm, 6am, ...) in your post"];
        }

        // get timezone
        var res = true;
        var zone = await tZ.findTimeZone(timezone);
        if(!res)
            return [false, undefined, undefined, "you need to provide a valid time zone (e.g. CET, Asia/Shanghai, EST ...) in your post"];

        
        var date = new Date();
        var res_date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), _time, 0, 0, 0, zone.name);
        return [true, res_date, zone, ""];
    },

    getUserLobbyTime: async function(lobbyTime, timezone) {
        
        var error =""
        try {
            // find user zone
            const userzone = await tZ.findTimeZone(timezone)
            const lobbyDate = new Date(lobbyTime);
            // calculate zoned time
            var zonedtime = await tZ.getZonedTime(lobbyDate, userzone)
        } catch(err) {
            error = err.message;
        };
        if(error == "")
            return [true, weekDays[zonedtime.dayOfWeek] + ", " + zonedtime.hours + ":00 " + timezone]

        return [false, error]
    }
}