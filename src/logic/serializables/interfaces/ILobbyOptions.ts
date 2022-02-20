import { ITime } from "../../time/interfaces/ITime";

export interface ILobbyOptions {
  type: number;
  date: ITime;
  guildId: string;
  coaches?: Array<string>;
  beginnerRoleIds?: Array<string>;
  regionId?: string;
  channelId?: string;
  messageId?: string;
  text?: string;
}
