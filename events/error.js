var counter = 0;
var maxCounter = 1;
/**
 * Emitted whenever the client failed to reconnect multiple times and is giving up - time to restart with forever
 * @param {Client} client discord client
 * @param {Event} event The disconnect event
 */
module.exports = async (client, event) => {
    console.error(`client's WebSocket encountered a connection error: ${event.message}`);
    if(counter++ > maxCounter)
        return process.exit(1);
}