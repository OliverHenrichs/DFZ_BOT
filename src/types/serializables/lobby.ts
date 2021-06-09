import { LobbyPlayer } from "../../misc/interfaces/LobbyInterfaces";

export class Lobby {
  type: number;
  date: number;
  users: Array<LobbyPlayer>;
  coaches: Array<string>;
  beginnerRoleIds: Array<string>;
  regionId: string;
  channelId: string;
  messageId: string;
  started: boolean = false;

  constructor(
    type: number,
    date: number,
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
