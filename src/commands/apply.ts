import { Message } from "discord.js";
import { DFZDiscordClient } from "../misc/interfaces/DFZDiscordClient";

const db = require("../misc/database");
const pl = require("../misc/types/player");
const r = require("../misc/types/referrer");

/**
 * Adds player to db on application
 */
module.exports = async (client: DFZDiscordClient, message: Message) => {
  var player = await db.getPlayerByID(client.dbHandle, message.author.id);
  if (player !== undefined) {
    // only add once
    console.log("Player " + message.author.id + "already exists");
    return;
  }

  var args = message.content.substring(6).split(",");
  args.forEach((element) => {
    element.trim();
  });

  var refTag = "";
  if (args.length > 4 && args[4] !== undefined) {
    var refTag = args[4].trim();
  }
  console.log("refTag = " + refTag);

  var re = /\S+#\d{4,5}/i; // matching user tag syntax asdf#1234
  if (refTag.match(re)) {
    console.log("matched refTag");
    var existingReferrer: Referrer = await db.getReferrerByTag(
      client.dbHandle,
      refTag
    );

    if (existingReferrer === undefined) {
      // add referrer
      var referrerId = undefined;
      var referrerUser = client.users.cache.find((u) => u.tag === refTag);
      if (referrerUser !== undefined) {
        referrerId = referrerUser.id;
      }
      await db.insertReferrer(
        client.dbHandle,
        new r.Referrer(referrerId === undefined ? "" : referrerId, refTag, 0)
      );
    }
  }

  db.insertPlayer(
    client.dbHandle,
    new pl.Player(message.author.id, message.author.tag, refTag)
  );
};
