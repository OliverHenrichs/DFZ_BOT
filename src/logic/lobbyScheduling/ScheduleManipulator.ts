import {EmbedField, Message, MessageEmbed, MessageReaction, TextBasedChannels, User,} from "discord.js";
import {DFZDiscordClient} from "../discord/DFZDiscordClient";
import {adminRoles, findRole} from "../discord/roleManagement";
import {Schedule} from "../serializables/schedule";
import {ScheduleSerializer} from "../serializers/ScheduleSerializer";
import {SerializeUtils} from "../serializers/SerializeUtils";
import {LobbyScheduler} from "./LobbyScheduler";
import {IScheduleManipulationData} from "./types/IScheduleManipulationData";

/**
 * Changes schedule state.
 */
export class ScheduleManipulator {
  private readonly client: DFZDiscordClient;
  private readonly reaction: MessageReaction;
  private readonly user: User;
  private readonly schedule: Schedule;

  private constructor(data: IScheduleManipulationData, schedule: Schedule) {
    this.client = data.client;
    this.reaction = data.reaction;
    this.user = data.user;
    this.schedule = schedule;
  }

  public static async removeCoachFromSchedule(
    data: IScheduleManipulationData
  ): Promise<void> {
    const manipulator = await ScheduleManipulator.createManipulator(data);
    return manipulator.removeCoachFromScheduleInt();
  }

  public static async addCoachToSchedule(
    data: IScheduleManipulationData
  ): Promise<void> {
    const manipulator = await ScheduleManipulator.createManipulator(data);
    return manipulator.addCoachToScheduleInt();
  }

  private static async createManipulator(
    data: IScheduleManipulationData
  ): Promise<ScheduleManipulator> {
    const schedule = await ScheduleManipulator.findSchedule(data);
    return new ScheduleManipulator(data, schedule);
  }

  private static async findSchedule(
    data: IScheduleManipulationData
  ): Promise<Schedule> {
    const gdbc = SerializeUtils.fromMessagetoGuildDBClient(
      data.reaction.message,
      data.client.dbClient
    );
    const emojiName = data.reaction.emoji.name;
    const serializer = new ScheduleSerializer(
      gdbc,
      data.reaction.message.id,
      emojiName ? emojiName : ""
    );
    const schedules = await serializer.get();
    if (schedules.length !== 1) throw new Error("Did not find schedule");
    return schedules[0];
  }

  private async removeCoachFromScheduleInt(): Promise<void> {
    if (!this.userIsCoach()) return;
    this.removeCoach();
    await this.handleScheduleCoachWithdrawal();
  }

  private async addCoachToScheduleInt(): Promise<void> {
    if (!(await this.assertUserHasCoachingPermissions())) return;
    if (this.userIsCoach()) {
      await this.user.send("⛔ You are already coaching that lobby.");
      return;
    }
    this.addCoach();
    await this.handleScheduleCoachAdd();
  }

  private async assertUserHasCoachingPermissions(): Promise<boolean> {
    const guildMember = await this.reaction.message.guild?.members.fetch(
      this.user.id
    );
    if (!guildMember) {
      await this.user.send("⛔ I could not find your ID in your guild.");
      return false;
    }

    const role = findRole(guildMember, adminRoles);
    if (role === undefined || role === null) {
      await this.user.send(
        "⛔ You cannot interact because you are not a coach."
      );
      return false;
    }

    return true;
  }

  private async handleScheduleCoachWithdrawal(): Promise<void> {
    this.schedule.eventId = undefined;
    await this.updateSchedulePost(this.reaction.message.channel);
    const gdbc = SerializeUtils.fromScheduletoGuildDBClient(
      this.schedule,
      this.client.dbClient
    );
    const serializer = new ScheduleSerializer(gdbc);
    await serializer.update(this.schedule);
    await this.user.send("✅ Removed you as coach from the scheduled lobby.");
  }

  private async handleScheduleCoachAdd(): Promise<void> {
    const gdbc = SerializeUtils.fromScheduletoGuildDBClient(
      this.schedule,
      this.client.dbClient
    );
    const serializer = new ScheduleSerializer(gdbc);
    serializer.update(this.schedule);

    const guild = this.reaction.message.guild;
    if (guild === null)
      throw new Error("Did not find guild in handleScheduleCoachAdd");

    await LobbyScheduler.insertScheduledLobbies(
      guild.channels,
      this.client.dbClient
    );
    await this.updateSchedulePost(this.reaction.message.channel);
    await this.user.send("✅ Added you as a coach to the scheduled lobby.");
  }

  private async updateSchedulePost(channel: TextBasedChannels): Promise<void> {
    try {
      const message = await channel.messages.fetch(this.schedule.messageId);
      if (message === undefined || message === null) return;

      await this.updateFieldAndPost(message);
    } catch (e) {
      console.log(`Error in UpdateSchedulePost: ${e}`);
    }
  }

  private async updateFieldAndPost(message: Message): Promise<boolean> {
    const old_embed = message.embeds[0];
    const embedField = this.getEmbedField(old_embed);

    const lines = embedField.field.value.split("\n");
    const lineIndex = this.getRelevantLineIndex(lines);
    if (lineIndex === -1) return false;

    this.applyCoachChange(lines, lineIndex);

    const new_embed = new MessageEmbed(old_embed);
    new_embed.fields[embedField.index].value = lines.join("\n");
    await message.edit({ embeds: [new_embed] });
    return true;
  }

  private applyCoachChange(lines: string[], lineIndex: number): void {
    lines[lineIndex + 1] = "coach 1: " + this.getCoachMention(0);
    if (this.schedule.coachCount > 1)
      lines[lineIndex + 2] = "coach 2: " + this.getCoachMention(1);
  }

  private getCoachMention(index: number): string {
    return this.schedule.coaches.length > index
      ? `<@${this.schedule.coaches[index]}>`
      : "";
  }

  private getEmbedField(old_embed: MessageEmbed) {
    const isRelevantEmbed = (field: EmbedField) =>
      field.value.indexOf(this.schedule.emoji) !== -1;
    const index = old_embed.fields.findIndex(isRelevantEmbed);
    if (index === -1) {
      throw new Error(
        "Could not find Embed field for schedule emoji " +
          this.schedule.emoji +
          "."
      );
    }
    return { field: old_embed.fields[index], index };
  }

  private getRelevantLineIndex(lines: string[]): number {
    const filterFun = (line: string, index: number) =>
      line.indexOf(this.schedule.emoji) !== -1 &&
      index + this.schedule.coachCount < lines.length;
    const lineIndex = lines.findIndex(filterFun);
    if (lineIndex === -1) {
      throw new Error(
        "Could not find Line associated with emoji " +
          this.schedule.emoji +
          " in Schedule setup."
      );
    }
    return lineIndex;
  }

  private userIsCoach(): boolean {
    return (
      this.schedule.coaches.find((coach: string) => coach === this.user.id) !==
      undefined
    );
  }

  private removeCoach(): void {
    this.schedule.coaches.splice(this.getCoachIndex(), 1);
  }

  private getCoachIndex(): number {
    return this.schedule.coaches.findIndex(
      (coach: string) => coach === this.user.id
    );
  }

  private addCoach(): void {
    this.schedule.coaches.push(this.user.id);
  }
}
