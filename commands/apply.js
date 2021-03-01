const db = require("../misc/database")
const pl = require("../misc/player")

/**
 * Adds player to db on application
 */
module.exports = async (message, dbHandle) => {
    var player = await db.getPlayerByID(dbHandle, message.author.id)
    if(player !== undefined) { // only add once
        return;
    }

    var args = message.content.substring(6).split(',');
    args.forEach(element => {
        element.trim();
    });

    if(args[4] === undefined && args[4] === "")
        return;

    var referralPlayer = await db.getPlayerByTag(dbHandle, args[4]);
    db.insertPlayer(dbHandle, new pl.Player(message.author.id, message.author.tag, referralPlayer === undefined ? "" : referralPlayer.tag));       
}