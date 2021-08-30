import { ITime } from "../../time/interfaces/Time";

export interface PostLobbyOptions {
  type: number;
  regionRole: string;
  userRoles: string[];
  time: ITime;
  coaches: string[];
  optionalText: string;
}
