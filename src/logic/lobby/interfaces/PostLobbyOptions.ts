import { ITime } from "../../time/interfaces/Time";

export interface PostLobbyOptions extends LobbyTitleOptions {
  regionRole: string;
  userRoles: string[];
  coaches: string[];
}

export interface LobbyTitleOptions {
  type: number;
  time: ITime;
  optionalText: string;
}
