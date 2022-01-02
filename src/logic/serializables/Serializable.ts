export abstract class Serializable {
  public guildId: string;

  constructor(guildId: string) {
    this.guildId = guildId;
  }
}
