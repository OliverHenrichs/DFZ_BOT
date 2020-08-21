const c = require("../misc/constants")

/**
    Check if player positions are a non-empty subset of {1,2,3,4,5}
    @param positions map of positions to be checked for correctness
    @param min min number value
    @param max max number value
    @return true if correct, false + error msg if not
*/
function checkNumbers(positions, min=0, max=5) {
    // error if empty
    if (positions.size == 0 || (positions.size == 1 && positions.has(NaN))) {
        return [false, "no positions were given"];
    }

    // error if not integer values
    for (let p of positions) {

        if (Number.isNaN(p)) {
            return [false, "at least one position is not a number."];
        }
        else if (p > max) {
            return [false, "at least one position is greater than 5."];
        }
        else if (p <= min) {
            return [false, "at least one position is smaller than 1."];
        }
    }
    return [true, ""];
}

/**
 * @param message message containing numbers
 * @param splitter integer value at which the message content must be split in order to retrieve numbers
 * @return [true if success, unique numbers, error message if not success]
 */
function getNumbersFromMessage(message, index, min=0, max=5) {

    var args = getArguments(message);

    if(args.length <= index)
        return [false, [], "you need to provide a list of numbers ranging from " + min + " to " + max + " in your post"];
    // split
    var numbers = args[index].split(",");

    // get integers
    for (pos in numbers) {
        numbers[pos] = Number(numbers[pos]);
    }
    // remove duplicates
    numbers.sort();
    var uniqueNumbers = new Set(numbers);

    // check numbers
    var checkResult = checkNumbers(uniqueNumbers, min=0, max=5);

    return [checkResult[0], uniqueNumbers, checkResult[1]];
}

function validateTime(timeString)
{
    // check length
    var l = timeString.length;
    if(l != 3 && l != 4)
        return false;

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
        return false;

    return true;
}

function getTimeFromMessage(message, index)
{
    var args = getArguments(message);

    if(args.length <= index)
        return [false, "", "you need to provide a valid full hour time (e.g. 9pm, 6am, ...) in your post"];

    // get time
    var timeString = args[index];
    if(!validateTime(timeString))
    {
        return [false, "", "you need to provide a valid full hour time (e.g. 9pm, 6am, ...) in your post"];
    }
    
    return [true, timeString, ""];
}

function getArguments(message) {
    var content = message.content.split(" ");
    content.shift();
    return content;
}

function getLobbyType(message) {
    var args = getArguments(message);

	if(args.length == 0 || args == "")
	{
		message.reply("no lobby type given. \r\n Lobby types are (" + Object.keys(c.lobbyTypes).join(", ") + ")");
		return undefined;
	}

	var type = args[0];
    var lobbyType = Object.keys(c.lobbyTypes).find(t => {return t==type;})
	if(lobbyType == undefined)
	{
		message.reply("Invalid lobby type. Lobby types are " + Object.keys(c.lobbyTypes).join(", "));
		return undefined;
    }
    
    return c.lobbyTypes[lobbyType];
}

module.exports.checkNumbers = checkNumbers;
module.exports.getNumbersFromMessage = getNumbersFromMessage;
module.exports.getArguments = getArguments;
module.exports.getLobbyType = getLobbyType;
module.exports.getTimeFromMessage = getTimeFromMessage;