/**
 * Just some pod that make up a coach
 */
class Coach {
  userId: string;
  lobbyCount: number;
  lobbyCountTryout: number;
  lobbyCountNormal: number;
  lobbyCountReplayAnalysis: number;

  /**
   * constructor
   * @param {string} userId
   * @param {number} lobbyCount
   * @param {number} lobbyCountTryout
   * @param {number} lobbyCountNormal
   * @param {number} lobbyCountReplayAnalysis
   */
  constructor(
    userId: string = "",
    lobbyCount: number = 0,
    lobbyCountTryout: number = 0,
    lobbyCountNormal: number = 0,
    lobbyCountReplayAnalysis: number = 0
  ) {
    this.userId = userId;
    this.lobbyCount = lobbyCount;
    this.lobbyCountTryout = lobbyCountTryout;
    this.lobbyCountNormal = lobbyCountNormal;
    this.lobbyCountReplayAnalysis = lobbyCountReplayAnalysis;
  }

  static fromObject(obj: any) {
    if (obj == null) return;
    var coach = new Coach();
    Object.assign(coach, obj);
    return coach;
  }
}

module.exports = {
  Coach,
};
