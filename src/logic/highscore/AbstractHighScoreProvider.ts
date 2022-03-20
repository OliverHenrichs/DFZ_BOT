import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { EmbeddingCreator } from "../discord/EmbeddingCreator";
import { IFieldElement } from "../discord/interfaces/IFieldElement";
import { HighScoreUserTypes } from "./enums/HighScoreUserTypes";
import { IHighScoreProviderSettings } from "./interfaces/IHighscoreProviderSettings";

export abstract class AbstractHighScoreProvider<T> {
  protected dbClient: DFZDataBaseClient;
  protected resultTable: IFieldElement[];
  protected userType: HighScoreUserTypes;

  protected constructor(settings: IHighScoreProviderSettings) {
    this.dbClient = settings.dbClient;
    this.resultTable = JSON.parse(JSON.stringify(settings.tableTemplate)); // deep copy...
    this.userType = settings.userType;
  }

  public async generateHighScoreEmbedding(guildId: string, guildName?: string) {
    await this.getHighscoreTable(guildId);
    return this.generateEmbedding(guildName);
  }

  protected abstract getUsersFromDatabase(guildId: string): Promise<T[]>;

  protected abstract rowAdder(user: T): void;

  private async getHighscoreTable(guildId: string) {
    const users = await this.getUsersFromDatabase(guildId);
    this.fillHighscoreTable(users);
    return this.resultTable;
  }

  private fillHighscoreTable(users: Array<T>) {
    const maxNum = 10;
    for (let i = 0; i < Math.min(maxNum, users.length); i++)
      this.rowAdder(users[i]);
  }

  private generateEmbedding(guildName?: string) {
    return EmbeddingCreator.create(
      `Lobby Highscores (${this.userType}) Top 10`,
      `Hall of Fame for ${guildName ? guildName + "'s" : "this guild's"}  ${
        this.userType
      }!`,
      "",
      this.resultTable
    );
  }
}
