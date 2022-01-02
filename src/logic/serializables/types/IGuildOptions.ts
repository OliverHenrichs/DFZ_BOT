import { IRegionAndChannel } from "./IRegionAndChannel";

export interface IGuildOptions {
  coachRoles: string[];
  lesserCoachRoles: string[];

  tryoutRole: string;
  tierRoles: string[];
  regionsAndChannels: IRegionAndChannel[];

  tryoutChannel: string;
  leaderboardChannel: string;
  lobbyChannels: string[];
}
