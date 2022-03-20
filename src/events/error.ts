import { Client } from "discord.js";

let counter = 0;
const maxCounter = 3;
/**
 * Emitted whenever the client has encountered an error; exits after maxCounter errors
 * @param {Client} _client discord client
 * @param {Event} event The disconnect event
 */
module.exports = async function (_client: Client, event: Error) {
  console.error(
    `client's WebSocket encountered a connection error: ${event.message}`
  );
  if (++counter >= maxCounter) return process.exit(1);
};
