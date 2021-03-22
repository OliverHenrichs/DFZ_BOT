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
  /**
   * constructor
   * @param {number} type
   * @param {number} date
   * @param {Array<string>} coaches
   * @param {Array<string>} beginnerRoleIds
   * @param {string} regionId
   * @param {string} channelId
   * @param {string} messageId
   */
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
  static fromObject(obj: any) {
    if (obj == null) return;
    var lobby = new Lobby();
    Object.assign(lobby, obj);
    return lobby;
  }
}

module.exports = {
  Lobby,
};
