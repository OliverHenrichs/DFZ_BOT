import { LobbyPlayer } from "../interfaces/LobbyInterfaces";

/**
 * Just some pod that make up a lobby
 */
export class Lobby {
  type: number;
  date: number;
  users: Array<LobbyPlayer>;
  coaches: Array<string>;
  beginnerRoleIds: Array<string>;
  regionId: string;
  channelId: string;
  messageId: string;
  
  constructor(
    type: number = -1,
    date: number = 0,
    coaches: Array<string> = [],
    beginnerRoleIds: Array<string> = [],
    regionId: string = "",
    channelId: string = "",
    messageId: string = ""
  ) {
    this.type = type;
    this.date = date;
    this.users = [];
    this.coaches = coaches;
    this.beginnerRoleIds = beginnerRoleIds;
    this.regionId = regionId;
    this.channelId = channelId;
    this.messageId = messageId;
  }
}
