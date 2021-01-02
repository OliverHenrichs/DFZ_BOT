/**
 * Emitted whenever the client failed to reconnect multiple times and is giving up - time to restart with forever
 * @param {Discord.Client} client discord client
 * @param {Event} event The disconnect event
 */
module.exports = async (client, event) => {
    console.log(`The WebSocket has closed and will no longer attempt to reconnect - exiting node`);
    return process.exit(1);
}