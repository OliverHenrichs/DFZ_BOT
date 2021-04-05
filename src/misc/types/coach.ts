/**
 * Just some pod that make up a coach
 */
export class Coach {
  userId: string;
  lobbyCount: number;
  lobbyCountTryout: number;
  lobbyCountNormal: number;
  lobbyCountReplayAnalysis: number;

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
}
