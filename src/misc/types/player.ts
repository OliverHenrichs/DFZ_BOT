/**
 * Just some pod that make up a player
 */
class Player {
  userId: string;
  tag: string;
  referredBy: string;
  referralLock: number;
  lobbyCount: number;
  lobbyCountUnranked: number;
  lobbyCountBotBash: number;
  lobbyCount5v5: number;
  lobbyCountReplayAnalysis: number;
  offenses: number;

  /**
   * constructor
   * @param {string} userId
   * @param {string} tag
   * @param {string} referredBy
   * @param {number} referralLock
   * @param {number} lobbyCount
   * @param {number} lobbyCountUnranked
   * @param {number} lobbyCountBotBash
   * @param {number} lobbyCount5v5
   * @param {number} lobbyCountReplayAnalysis
   * @param {number} offenses
   */
  constructor(
    userId: string = "",
    tag: string = "",
    referredBy: string = "",
    referralLock: number = 0,
    lobbyCount: number = 0,
    lobbyCountUnranked: number = 0,
    lobbyCountBotBash: number = 0,
    lobbyCount5v5: number = 0,
    lobbyCountReplayAnalysis: number = 0,
    offenses: number = 0
  ) {
    this.userId = userId;
    this.tag = tag;
    this.referredBy = referredBy;
    this.referralLock = referralLock;
    this.lobbyCount = lobbyCount;
    this.lobbyCountUnranked = lobbyCountUnranked;
    this.lobbyCountBotBash = lobbyCountBotBash;
    this.lobbyCount5v5 = lobbyCount5v5;
    this.lobbyCountReplayAnalysis = lobbyCountReplayAnalysis;
    this.offenses = offenses;
  }
  static fromObject(obj: any) {
    if (obj == null) return;
    var player = new Player();
    Object.assign(player, obj);
    return player;
  }
}
module.exports = {
  Player,
};
