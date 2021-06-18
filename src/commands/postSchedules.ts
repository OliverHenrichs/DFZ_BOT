import { Message } from "discord.js";
import { guildId } from "../misc/constants";
import { reactNegative, reactPositive } from "../misc/messageHelper";
import { addCurrentWeekSchedule } from "../misc/scheduleManagement";
import { getCurrentMondayAndSundayDate } from "../misc/timeZone";
import { DFZDataBaseClient } from "../types/database/DFZDataBaseClient";
import { DFZDiscordClient } from "../types/DFZDiscordClient";
import { Schedule } from "../types/serializables/schedule";
import { ScheduleSerializer } from "../types/serializers/scheduleSerializer";

export default async (message: Message, client: DFZDiscordClient) => {
  postSchedules(client)
    .then((text) => {
      reactPositive(message, text);
    })
    .catch((error) => {
      reactNegative(message, error);
    });
};

async function postSchedules(client: DFZDiscordClient) {
  if (!(await weeklyScheduleShouldBePosted(client)))
    return "I already posted this week's schedules";

  const guild = await fetchGuild(client);
  addCurrentWeekSchedule(guild.channels, client.dbClient);
}

async function weeklyScheduleShouldBePosted(client: DFZDiscordClient) {
  const schedules = await getAllSchedules(client.dbClient);
  const { monday } = getCurrentMondayAndSundayDate();
  return !existsScheduleAfterMonday(schedules, monday);
}

async function getAllSchedules(dbClient: DFZDataBaseClient) {
  const serializer = new ScheduleSerializer(dbClient);
  return await serializer.get();
}

function existsScheduleAfterMonday(schedules: Schedule[], monday: Date) {
  const scheduleAfterMonday = schedules.find(
    (schedule) => monday < new Date(Number(schedule.date))
  );

  return scheduleAfterMonday !== undefined;
}

async function fetchGuild(client: DFZDiscordClient) {
  const guild = await client.guilds.fetch(guildId);
  if (guild === undefined || guild === null)
    throw new Error(
      "Did not find DFZ Guild. Something's seriously effed up on Discord."
    );
  return guild;
}
