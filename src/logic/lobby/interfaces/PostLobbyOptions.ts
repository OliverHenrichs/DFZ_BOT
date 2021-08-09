import { Time } from "../../../misc/timeZone";

export interface PostLobbyOptions {
  type: number;
  regionRole: string;
  userRoles: string[];
  time: Time;
  coaches: string[];
  optionalText: string;
}
