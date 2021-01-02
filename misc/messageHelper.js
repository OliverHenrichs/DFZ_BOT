const c = require("../misc/constants")
const g = require("../misc/generics")
const rM = require("../misc/roleManagement")
const tZ = require("../misc/timeZone")


/**
 * Reacts to message using reply and emoji
 * @param {Discord.Message} message message to be replied to
 * @param {string} reply string containing reply message
 * @param {string} emoji emoji to react with
 */
async function reactMessage(message, reply, emoji)
{
    message.react(emoji).then(() => message.delete(5000));
    
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
 * @param {Discord.Message} message message to react to
 * @param {string} reply string reply
 */
function reactNegative(message, reply = "")
{
    reactMessage(message, reply, '⛔');
}

/**
 * Creates a neutral reaction
 * @param {Discord.Message} message message to react to
 * @param {string} reply string reply
 */
function reactNeutral(message, reply = "")
{
    reactMessage(message, reply, '😐');
}

/**
 * Creates a positive reaction
 * @param {Discord.Message} message message to react to
 * @param {string} reply string reply
 */
function reactPositive(message, reply = "")
{
    reactMessage(message, reply, '✅');
}

/**
 * Creates initial reaction to lobby post for users to react to
 * @param {int} lobbyType 
 * @param {Discord.Message} message 
 */
function createLobbyPostReactions(lobbyType, message) 
{
	if(lobbyType == c.lobbyTypes.tryout)
	{
		message.react(c.tryoutReactionEmoji);
	}
	else 
	{
		for(let idx = 0; idx < c.positionReactionEmojis.length; idx++)
		{
			message.react(c.positionReactionEmojis[idx]);
		}  
    }
    
    for(let idx = 0; idx < c.lobbyManagementReactionEmojis.length; idx++)
    {
        message.react(c.lobbyManagementReactionEmojis[idx]);
    }
}

/**
 * Retrieves a sequence of unique numbers from an index of a message split at spaces
 * @param {Discord.Message} message message containing numbers
 * @param {uint} index index at which the message content must be split in order to retrieve numbers
 * @param {int} min min allowed number
 * @param {int} max max allowed number
 * @return [true if success, unique numbers, error message if not success]
 */
function getNumbersFromMessage(message, index, min=0, max=5) {

    var args = getArguments(message);

    if(args.length <= index)
        return [false, [], "you need to provide a list of numbers ranging from " + min + " to " + max + " in your post"];
    
    return g.getNumbersFromString(args[index]);
}

/**
 * Retrieves a region from an index of a message split at spaces
 * message containing regional role
 * @param {Discord.Message} message 
 * @param {int} index 
 */
function getLobbyRegionRoleFromMessage(message, index) 
{
    var args = getArguments(message);

    // message to short
    if(args.length <= index)
        return undefined;
    
    return rM.getRegionalRoleFromString(args[index])
}

/**
 * Takes time part out of message by splitting and taking the part at index, then validates and returns the time
 * @param {Discord.Message} message message containing the time
 * @param {int} index position of time in the message
 */
function getTimeFromMessage(message, index)
{
    var args = getArguments(message);

    if(args.length <= index + 1)
        return [false, "", "you need to provide a valid full hour time (e.g. 9pm CET, 6am GMT+2, ...) in your post"];

    return tZ.createLobbyTime(args[index], args[index+1]);
}

/**
 * returns arguments of message of form "command arg1 arg2 ... argN"
 * @param {Discord.Message} message 
 */
function getArguments(message) {
    var content = message.content.split(" ");
    content.shift();
    return content;
}

/**
 * Derives lobby type from message and reacts based on evaluation
 * @param {Discord.Message} message message from which to derive lobby type
 */
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
module.exports.createLobbyPostReactions = createLobbyPostReactions;
module.exports.getNumbersFromMessage = getNumbersFromMessage;
module.exports.getLobbyRegionRoleFromMessage = getLobbyRegionRoleFromMessage;
module.exports.getArguments = getArguments;
module.exports.getLobbyType = getLobbyType;
module.exports.getTimeFromMessage = getTimeFromMessage;