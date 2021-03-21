import { Client } from "discord.js";

var counter = 0;
var maxCounter = 3;
/**
 * Emitted whenever the client has encountered an error; exits after maxCounter errors
 * @param {Client} client discord client
 * @param {Event} event The disconnect event
 */
module.exports = async function (client: Client, event: Error) {
  console.error(
    `client's WebSocket encountered a connection error: ${event.message}`
  );
  if (++counter >= maxCounter) return process.exit(1);
};
