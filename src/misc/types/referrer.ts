/**
 * Just some pod that make up a referrer (a discord account that referred new player to dfz)
 */
export class Referrer {
  userId: string;
  tag: string;
  referralCount: number;
  
  constructor(
    userId: string = "",
    tag: string = "",
    referralCount: number = 0
  ) {
    this.userId = userId;
    this.tag = tag;
    this.referralCount = referralCount;
  }
}
