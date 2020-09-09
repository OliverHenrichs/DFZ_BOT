const c = require("../misc/constants")
const tZ = require("../misc/timeZone")


/**
 * Reacts to message using reply and emoji
 * @param {message} message message to be replied to
 * @param {string} reply string containing reply message
 * @param {string} emoji emoji to react with
 */
async function reactMessage(message, reply, emoji)
{
    message.react(emoji);
    message.delete(5000);
    if(reply == "" ) 
        return;

    try {
        await message.author.send("`"+message.content+"`\n"+emoji+" "+ reply);
    } catch(err) {
        message.reply("Cannot send messages to you. Enable direct messages in privacy settings to receive bot replies.");
    };
}

/**
 * Creates a negative reaction
 * @param {message} message message to react to
 * @param {string} reply string reply
 */
function reactNegative(message, reply = "")
{
    reactMessage(message, reply, '⛔');
}

/**
 * Creates a neutral reaction
 * @param {message} message message to react to
 * @param {string} reply string reply
 */
function reactNeutral(message, reply = "")
{
    reactMessage(message, reply, '😐');
}


/**
 * Creates a positive reaction
 * @param {message} message message to react to
 * @param {string} reply string reply
 */
function reactPositive(message, reply = "")
{
    reactMessage(message, reply, '✅');
}

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

/**
 * Takes time part out of message by splitting and taking the part at index, then validates and returns the time
 * @param {*} message message containing the time
 * @param {*} index position of time in the message
 */
function getTimeFromMessage(message, index)
{
    var args = getArguments(message);

    if(args.length <= index + 1)
        return [false, "", "you need to provide a valid full hour time (e.g. 9pm CET, 6am GMT+2, ...) in your post"];

    var tomorrow = false;
    if(args.length >= index + 2)
        tomorrow = args[index+2] == "tomorrow"
    return tZ.createLobbyTime(args[index], args[index+1], tomorrow);
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
        reactNegative(message, "no lobby type given. \r\n Lobby types are (" + Object.keys(c.lobbyTypes).join(", ") + ")")
		return undefined;
	}

	var type = args[0];
    var lobbyType = Object.keys(c.lobbyTypes).find(t => {return t==type;})
	if(lobbyType == undefined)
	{
        reactNegative(message, "Invalid lobby type. Lobby types are " + Object.keys(c.lobbyTypes).join(", "))
		return undefined;
    }
    
    return c.lobbyTypes[lobbyType];
}

module.exports.reactNeutral = reactNeutral;
module.exports.reactNegative = reactNegative;
module.exports.reactPositive = reactPositive;
module.exports.checkNumbers = checkNumbers;
module.exports.getNumbersFromMessage = getNumbersFromMessage;
module.exports.getArguments = getArguments;
module.exports.getLobbyType = getLobbyType;
module.exports.getTimeFromMessage = getTimeFromMessage;