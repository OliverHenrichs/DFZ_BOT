import { lobbyChannels } from "../misc/channelManagement";
import { getLobbies, getSchedules } from "../misc/database";
import { DFZDiscordClient } from "../misc/types/DFZDiscordClient";
import { updateLobbyPosts } from "../misc/lobbyManagement";
import {
  updateSchedules,
  insertScheduledLobbies,
} from "../misc/scheduleManagement";
import { Schedule } from "../misc/types/schedule";
import {
  postReferralLeaderboard,
  findClientMessage,
} from "../misc/leaderBoardPoster";

const guildId: string =
  process.env.GUILD !== undefined ? process.env.GUILD : "";

function getUniqueSchedulePosts(schedules: Array<Schedule>) {
  var fetchedSchedulePosts = [];

  for (const schedule of schedules) {
    const containsPost: boolean =
      fetchedSchedulePosts.find(
        (fetched) =>
          fetched.messageId == schedule.messageId &&
          fetched.channelId === schedule.channelId
      ) !== undefined;
    if (containsPost) continue;

    fetchedSchedulePosts.push({
      messageId: schedule.messageId,
      channelId: schedule.channelId,
    });
  }

  return fetchedSchedulePosts;
}

/**
 * Fetch lobby messages from bot channels on startup
 * and setup all interval tasks
 *
 * @param {DFZDiscordClient} client discord client
 */
module.exports = async (client: DFZDiscordClient) => {
  console.log("Ready at " + new Date().toLocaleString());

  try {
    var guild = await client.guilds.fetch(guildId);
    for (const channel of lobbyChannels) {
      var gc = guild.channels.cache.find((chan) => chan.id === channel);
      if (gc === undefined || !gc.isText()) {
        continue;
      }

      var lobbies = await getLobbies(client.dbHandle, channel);
      if (lobbies.length === 0 || lobbies === [] || lobbies === undefined)
        continue;

      for (const lobby of lobbies) {
        await gc.messages.fetch(lobby.messageId);
      }
    }
  } catch {
    (err: string) => console.log(err);
  }

  try {
    var schedules: Array<Schedule> = await getSchedules(
      client.dbHandle,
      "",
      ""
    );

    if (schedules !== undefined && schedules.length !== 0) {
      // we have many schedules per messages => only fetch each message once
      var fetchedSchedulePosts = getUniqueSchedulePosts(schedules);

      var guild = await client.guilds.fetch(guildId);
      for (const post of fetchedSchedulePosts) {
        var gc = guild.channels.cache.find(
          (chan) => chan.id === post.channelId
        );

        if (gc === undefined || !gc.isText()) {
          continue;
        }
        gc.messages.fetch(post.messageId);
      }
    }
  } catch {
    (err: string) =>
      console.log("Error while posting lobbies from schedule:\n" + err);
  }

  try {
    // update lobby posts
    const timeUpdater = async () => {
      try {
        var guild = await client.guilds.fetch(guildId);
        if (guild === undefined || guild === null) return;
        await updateLobbyPosts(guild, client.dbHandle);
      } catch {
        (err: string) => console.log(err);
      }
    };
    await timeUpdater();
    setInterval(timeUpdater, 60000); // once per minute
  } catch {
    (err: string) => console.log("Error in timeUpdater:\n" + err);
  }

  try {
    // update lobby schedule
    const scheduleWriter = async () => {
      var guild = await client.guilds.fetch(guildId);
      if (guild === undefined || guild === null) return;
      updateSchedules(client.dbHandle, guild.channels);
    };
    await scheduleWriter();

    setInterval(scheduleWriter, 60 * 60000); // once per hour
  } catch {
    (err: string) => console.log("Error in scheduleWriter:\n" + err);
  }

  try {
    // post lobbies from schedule
    const lobbyPoster = async () => {
      var guild = await client.guilds.fetch(guildId);
      if (guild === undefined || guild === null) return;
      await insertScheduledLobbies(guild.channels, client.dbHandle);
    };
    await lobbyPoster();
    setInterval(lobbyPoster, 60 * 60000); // once per hour
  } catch {
    (err: string) => console.log("Error in lobbyPoster:\n" + err);
  }

  try {
    // post current leaderboard for referrers in channel
    const leaderBordPoster = async () => {
      await postReferralLeaderboard(client);
    };
    await findClientMessage(client);
    await postReferralLeaderboard(client);
    setInterval(leaderBordPoster, 60 * 60000); // once per hour
  } catch {
    (err: string) => console.log("Error in leaderBordPoster:\n" + err);
  }
};
