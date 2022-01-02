import { Serializable } from "./Serializable";
import { IGuildOptions } from "./types/IGuildOptions";
import { IRegionAndChannel } from "./types/IRegionAndChannel";

export class Guild extends Serializable {
  public coachRoles: string[] = [];
  public lesserCoachRoles: string[] = [];

  public tryoutRole: string = "";
  public tierRoles: string[] = [];
  public regionsAndChannels: IRegionAndChannel[] = [];

  public tryoutChannel: string = "";
  public leaderboardChannel: string = "";
  public lobbyChannels: string[] = [];

  constructor(guildId: string, options: IGuildOptions) {
    super(guildId);

    this.coachRoles = options.coachRoles;
    this.lesserCoachRoles = options.lesserCoachRoles;

    this.tryoutRole = options.tryoutRole;
    this.tierRoles = options.tierRoles;
    this.regionsAndChannels = options.regionsAndChannels;

    this.tryoutChannel = options.tryoutChannel;
    this.leaderboardChannel = options.leaderboardChannel;
    this.lobbyChannels = options.lobbyChannels;
  }
}
