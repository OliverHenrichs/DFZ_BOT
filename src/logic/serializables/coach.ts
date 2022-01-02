import { Serializable } from "./Serializable";

export class Coach extends Serializable {
  userId: string;
  lobbyCount: number;
  lobbyCountTryout: number;
  lobbyCountNormal: number;
  lobbyCountReplayAnalysis: number;

  constructor(
    userId: string,
    guildId: string,
    lobbyCount: number = 0,
    lobbyCountTryout: number = 0,
    lobbyCountNormal: number = 0,
    lobbyCountReplayAnalysis: number = 0
  ) {
    super(guildId);
    this.userId = userId;
    this.lobbyCount = lobbyCount;
    this.lobbyCountTryout = lobbyCountTryout;
    this.lobbyCountNormal = lobbyCountNormal;
    this.lobbyCountReplayAnalysis = lobbyCountReplayAnalysis;
  }
}
