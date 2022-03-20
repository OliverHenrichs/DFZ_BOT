import { ITime } from "../../time/interfaces/ITime";

export interface IPostLobbyOptions extends ILobbyTitleOptions {
  regionRole: string;
  userRoles: string[];
  coaches: string[];
  guildId: string;
}

export interface ILobbyTitleOptions {
  type: number;
  time: ITime;
  optionalText: string;
}
