import { Message } from "discord.js";
import { IFieldElement } from "../discord/interfaces/FieldElement";
import { reactPositive } from "../../misc/messageHelper";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { EmbeddingCreator } from "../discord/EmbeddingCreator";
import { HighscoreUserTypes } from "./enums/HighscoreUserTypes";
import { IHighscoreProviderSettings } from "./interfaces/HighscoreProviderSettings";

export abstract class AbstractHighscoreProvider<T> {
  protected dbClient: DFZDataBaseClient;
  protected resultTable: IFieldElement[];
  protected userType: HighscoreUserTypes;

  constructor(settings: IHighscoreProviderSettings) {
    this.dbClient = settings.dbClient;
    this.resultTable = JSON.parse(JSON.stringify(settings.tableTemplate)); // deep copy...
    this.userType = settings.userType;
  }

  public async postHighscore(message: Message) {
    const users = await this.getUsersFromDatabase();
    this.fillTableAndSendHighscores(users, message);
  }

  public generateHighscore(users: T[]) {
    this.fillHighscoreTable(users);
    return this.resultTable;
  }

  protected abstract getUsersFromDatabase(): Promise<T[]>;

  private async fillTableAndSendHighscores(users: T[], message: Message) {
    this.fillHighscoreTable(users);
    this.sendHighscoreTable(message);
  }

  private fillHighscoreTable(users: Array<T>) {
    const maxNum = 10;
    for (let i = 0; i < Math.min(maxNum, users.length); i++)
      this.rowAdder(users[i]);
  }

  private sendHighscoreTable(message: Message) {
    reactPositive(message);

    var _embed = EmbeddingCreator.create(
      "Lobby Highscores (" + this.userType + ") Top 10",
      "Hall of Fame of DFZ " + this.userType + "!",
      "",
      this.resultTable
    );
    message.author.send({ embeds: [_embed] });
  }

  protected abstract rowAdder(user: T): void;
}
