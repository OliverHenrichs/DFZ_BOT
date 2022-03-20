export abstract class Serializable {
  public guildId: string;

  protected constructor(guildId: string) {
    this.guildId = guildId;
  }
}
