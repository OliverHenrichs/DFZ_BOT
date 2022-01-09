import { MessageReaction, User } from "discord.js";
import { DFZDiscordClient } from "../discord/DFZDiscordClient";
import { adminRoles, findRole } from "../discord/roleManagement";
import { GoogleCalendarManager } from "../gcalendar/GoogleCalendarManager";
import { Schedule } from "../serializables/schedule";
import { ScheduleSerializer } from "../serializers/ScheduleSerializer";
import { SerializeUtils } from "../serializers/SerializeUtils";
import { findSchedule, insertScheduledLobbies } from "./scheduleManagement";

/**
 * Changes schedule state.
 */
export class ScheduleManipulator {
  /**
   * Checks if user is coach in schedule, and if yes, removes them.
   * Then updates the schedules / google events to reflect this
   * @param  client discord client (fetching users for rewriting schedule google calendar event)
   * @param  reaction determines which schedule we update
   * @param  user the guy who removed the reaction
   */
  public static async removeCoachFromSchedule(
    client: DFZDiscordClient,
    reaction: MessageReaction,
    user: User
  ): Promise<void> {
    var schedule = await findSchedule(
      client.dbClient,
      reaction.message,
      reaction.emoji.name
    );
    if (schedule === undefined) return;

    var idx = schedule.coaches.findIndex((coach: string) => coach === user.id);
    if (idx === -1) return;

    // remove coach
    schedule.coaches.splice(idx, 1);

    // update google event
    try {
      await GoogleCalendarManager.editCalendarEvent(schedule, client);
    } catch (err) {
      console.log(err);
    }

    await ScheduleManipulator.handleScheduleCoachWithdrawal(
      client,
      reaction,
      user,
      schedule
    );
  }

  /**
   * Checks if user is coach in schedule, and if not, adds them.
   * Then updates the schedules / google events to reflect this
   * @param {DFZDiscordClient} client discord client (fetching users for rewriting schedule google calendar event)
   * @param {MessageReaction} reaction determines which schedule we update
   * @param {User} user the guy who removed the reaction
   */
  public static async addCoachToSchedule(
    client: DFZDiscordClient,
    reaction: MessageReaction,
    user: User
  ) {
    const guildMember = await reaction.message.guild?.members.fetch(user.id);
    if (guildMember === undefined) {
      user.send("⛔ I could not find your ID in the DotaFromZero Discord.");
      return;
    }

    const role = findRole(guildMember, adminRoles);
    if (role === undefined || role === null) {
      user.send("⛔ You cannot interact because you are not a coach.");
      return;
    }

    var schedule = await findSchedule(
      client.dbClient,
      reaction.message,
      reaction.emoji.name
    );
    if (schedule === undefined) return;

    if (schedule.coaches.find((coach: string) => coach === user.id)) {
      user.send("⛔ You are already coaching that lobby.");
      return;
    }

    schedule.coaches.push(user.id);

    await ScheduleManipulator.updateOrCreateGoogleEvent(client, schedule);
    await ScheduleManipulator.tryHandleScheduleCoachAdd(
      client,
      reaction,
      user,
      schedule
    );
  }

  /**
   * handles how schedules and calendar events react to coach withdrawal
   * @param {DFZDiscordClient} client
   * @param {MessageReaction} reaction
   * @param {User} user
   * @param {Schedule} schedule
   */
  private static async handleScheduleCoachWithdrawal(
    client: DFZDiscordClient,
    reaction: MessageReaction,
    user: User,
    schedule: Schedule
  ) {
    return new Promise(async function (resolve, reject) {
      try {
        schedule.eventId = undefined;
        await module.exports.updateSchedulePost(
          schedule,
          reaction.message.channel
        );
        const gdbc = SerializeUtils.fromScheduletoGuildDBClient(
          schedule,
          client.dbClient
        );
        const serializer = new ScheduleSerializer(gdbc);
        await serializer.update(schedule);
        user.send("✅ Removed you as coach from the scheduled lobby.");
        resolve("Updated schedules");
      } catch (e) {
        reject("Failed updating schedule");
      }
    });
  }

  private static async updateOrCreateGoogleEvent(
    client: DFZDiscordClient,
    schedule: Schedule
  ) {
    try {
      await ScheduleManipulator.tryUpdateOrCreateGoogleEvent(client, schedule);
    } catch (err) {
      console.log(err);
    }
  }

  private static async tryUpdateOrCreateGoogleEvent(
    client: DFZDiscordClient,
    schedule: Schedule
  ) {
    if (schedule.eventId === undefined || schedule.eventId === "No Calendar")
      schedule.eventId = await GoogleCalendarManager.createCalendarEvent(
        schedule,
        client
      );
    else
      schedule.eventId = await GoogleCalendarManager.editCalendarEvent(
        schedule,
        client
      );
  }

  /**
   * handles how schedules and calendar events react to addition of a coach
   * @param {DFZDiscordClient} client
   * @param {MessageReaction} reaction
   * @param {User} user
   * @param {Schedule} schedule
   */
  private static async tryHandleScheduleCoachAdd(
    client: DFZDiscordClient,
    reaction: MessageReaction,
    user: User,
    schedule: Schedule
  ) {
    try {
      await ScheduleManipulator.handleScheduleCoachAdd(
        schedule,
        client,
        reaction,
        user
      );
    } catch (e) {
      console.warn("Failed updating schedule");
    }
  }

  private static async handleScheduleCoachAdd(
    schedule: Schedule,
    client: DFZDiscordClient,
    reaction: MessageReaction,
    user: User
  ) {
    const gdbc = SerializeUtils.fromScheduletoGuildDBClient(
      schedule,
      client.dbClient
    );
    const serializer = new ScheduleSerializer(gdbc);
    await serializer.update(schedule);

    const guild = reaction.message.guild;
    if (guild === null)
      throw new Error("Did not find guild in handleScheduleCoachAdd");
    await insertScheduledLobbies(guild.channels, client.dbClient);
    await module.exports.updateSchedulePost(schedule, reaction.message.channel);
    user.send("✅ Added you as a coach to the scheduled lobby.");
  }
}
