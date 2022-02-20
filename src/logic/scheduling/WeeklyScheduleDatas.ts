import { scheduleTypes } from "../../misc/types/scheduleTypes";
import { ChannelManager } from "../discord/DFZChannelManager";
import { IWeeklyScheduleData } from "./types/IWeeklyScheduleData";

const t1_t2_Data: IWeeklyScheduleData = {
  coachCount: 2,
  daysByRegion: [[3, 5, 0]],
  timesByRegion: [
    ["8:00pm", "8:00pm", "4:00pm"],
    ["8:00pm", "8:00pm", "4:00pm"],
    ["9:00pm", "9:00pm", "4:00pm"],
  ],
  channelId: ChannelManager.scheduleChannel5v5,
  type: scheduleTypes.lobbyt1,
};
const t3_t4_Data: IWeeklyScheduleData = {
  coachCount: 2,
  daysByRegion: [[2, 5, 0]],
  timesByRegion: [
    ["8:00pm", "8:00pm", "4:00pm"],
    ["8:00pm", "8:00pm", "4:00pm"],
    ["9:00pm", "9:00pm", "4:00pm"],
  ],
  channelId: ChannelManager.scheduleChannel5v5_t3,
  type: scheduleTypes.lobbyt3,
};
const tryoutData: IWeeklyScheduleData = {
  coachCount: 1,
  daysByRegion: [[2, 4, 6]],
  timesByRegion: [["8:00pm", "8:00pm", "8:00pm"]],
  channelId: ChannelManager.scheduleChannelTryout,
  type: scheduleTypes.tryout,
};
const botbashData: IWeeklyScheduleData = {
  coachCount: 1,
  daysByRegion: [[2, 4, 6]],
  timesByRegion: [["8:45pm", "8:45pm", "8:45pm"]],
  channelId: ChannelManager.scheduleChannelBotbash,
  type: scheduleTypes.botbash,
};

export const weeklyScheduleDatas = [
  botbashData,
  tryoutData,
  t3_t4_Data,
  t1_t2_Data,
];
