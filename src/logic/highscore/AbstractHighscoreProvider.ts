import { Message } from "discord.js";
import { getGuildIdFromMessage, reactPositive } from "../../misc/messageHelper";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { EmbeddingCreator } from "../discord/EmbeddingCreator";
import { IFieldElement } from "../discord/interfaces/IFieldElement";
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
    const gid = getGuildIdFromMessage(message);
    const users = await this.getUsersFromDatabase(gid);
    this.fillTableAndSendHighscores(users, message);
  }

  public generateHighscore(users: T[]) {
    this.fillHighscoreTable(users);
    return this.resultTable;
  }

  protected abstract getUsersFromDatabase(guildId: string): Promise<T[]>;

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
    var embed = EmbeddingCreator.create(
      "Lobby Highscores (" + this.userType + ") Top 10",
      "Hall of Fame of DFZ " + this.userType + "!",
      "",
      this.resultTable
    );
    message.author.send({ embeds: [embed] });
  }

  protected abstract rowAdder(user: T): void;
}
