/**
 * Just some pod that make up a referrer (a discord account that referred new player to dfz)
 */
class Referrer {
  userId: string;
  tag: string;
  referralCount: number;

  /**
   * constructor
   * @param {string} userId
   * @param {string} tag
   * @param {number} referralCount
   */
  constructor(
    userId: string = "",
    tag: string = "",
    referralCount: number = 0
  ) {
    this.userId = userId;
    this.tag = tag;
    this.referralCount = referralCount;
  }
  static fromObject(obj: any) {
    if (obj == null) return;
    var ref = new Referrer();
    Object.assign(ref, obj);
    return ref;
  }
}
module.exports = {
  Referrer,
};
