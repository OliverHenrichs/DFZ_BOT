import { Serializable } from "./Serializable";

/**
 * Just some pod that make up a referrer (a discord account that referred new player to dfz)
 */
export class Referrer extends Serializable {
  public userId: string;
  public tag: string;
  public referralCount: number;

  constructor(
    userId: string = "",
    guildId: string,
    tag: string = "",
    referralCount: number = 0
  ) {
    super(guildId);
    this.userId = userId;
    this.tag = tag;
    this.referralCount = referralCount;
  }
}
