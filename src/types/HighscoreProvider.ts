import { Message } from "discord.js";
import { generateEmbedding } from "../misc/answerEmbedding";
import {
  tableBasePlayersTemplate,
  addDBPlayerRowToTable,
  tableBaseCoachesTemplate,
  addDBCoachRowToTable,
  tableBaseReferrersTemplate,
  addDBReferrerRowToTable,
} from "../misc/highScoreTables";
import { FieldElement } from "../misc/interfaces/FieldElement";
import { reactPositive } from "../misc/messageHelper";
import { DFZDataBaseClient } from "./database/DFZDataBaseClient";
import { Coach } from "./serializables/coach";
import { Player } from "./serializables/player";
import { Referrer } from "./serializables/referrer";
import { CoachSerializer } from "./serializers/coachSerializer";
import { PlayerSerializer } from "./serializers/playerSerializer";
import { ReferrerSerializer } from "./serializers/referrerSerializer";

export enum HighscoreUserTypes {
  players = "players",
  coaches = "coaches",
  referrers = "referrers",
}

interface HighscoreProviderSettings {
  dbClient: DFZDataBaseClient;
  tableTemplate: FieldElement[];
  userType: HighscoreUserTypes;
}

abstract class AbstractHighscoreProvider<T> {
  dbClient: DFZDataBaseClient;
  resultTable: FieldElement[];
  userType: HighscoreUserTypes;

  constructor(settings: HighscoreProviderSettings) {
    this.dbClient = settings.dbClient;
    this.resultTable = JSON.parse(JSON.stringify(settings.tableTemplate)); // deep copy...
    this.userType = settings.userType;
  }

  async generateHighscores(message: Message) {
    const users = await this.getUsersFromDatabase();
    this.fillTableAndSendHighscores(users, message);
  }

  abstract getUsersFromDatabase(): Promise<T[]>;

  async fillTableAndSendHighscores(users: T[], message: Message) {
    this.fillHighscoreTable(users);
    this.sendHighscoreTable(message);
  }

  fillHighscoreTable(users: Array<T>) {
    const maxNum = 10;
    for (let i = 0; i < Math.min(maxNum, users.length); i++)
      this.rowAdder(users[i]);
  }

  sendHighscoreTable(message: Message) {
    reactPositive(message);

    var _embed = generateEmbedding(
      "Lobby Highscores (" + this.userType + ") Top 10",
      "Hall of Fame of DFZ " + this.userType + "!",
      "",
      this.resultTable
    );
    message.author.send({ embed: _embed });
  }

  abstract rowAdder(user: T): void;
}

export class PlayerHighscoreProvider extends AbstractHighscoreProvider<Player> {
  constructor(dbClient: DFZDataBaseClient) {
    const settings: HighscoreProviderSettings = {
      dbClient: dbClient,
      tableTemplate: tableBasePlayersTemplate,
      userType: HighscoreUserTypes.players,
    };

    super(settings);
  }

  async getUsersFromDatabase() {
    const serializer = new PlayerSerializer(this.dbClient);
    const players = await serializer.getSorted();
    if (players.length === 0) throw "No highscore player entries.";
    return players;
  }

  rowAdder(user: Player): void {
    addDBPlayerRowToTable(this.resultTable, user);
  }
}

export class CoachHighscoreProvider extends AbstractHighscoreProvider<Coach> {
  constructor(dbClient: DFZDataBaseClient) {
    const settings: HighscoreProviderSettings = {
      dbClient: dbClient,
      tableTemplate: tableBaseCoachesTemplate,
      userType: HighscoreUserTypes.coaches,
    };

    super(settings);
  }

  async getUsersFromDatabase() {
    const serializer = new CoachSerializer(this.dbClient);
    const coaches = await serializer.getSorted();
    if (coaches.length === 0) throw "No highscore coach entries.";
    return coaches;
  }

  rowAdder(user: Coach): void {
    addDBCoachRowToTable(this.resultTable, user);
  }
}

export class ReferrerHighscoreProvider extends AbstractHighscoreProvider<Referrer> {
  constructor(dbClient: DFZDataBaseClient) {
    const settings: HighscoreProviderSettings = {
      dbClient: dbClient,
      tableTemplate: tableBaseReferrersTemplate,
      userType: HighscoreUserTypes.referrers,
    };

    super(settings);
  }

  async getUsersFromDatabase() {
    const serializer = new ReferrerSerializer(this.dbClient);
    const referrers = await serializer.getSorted();
    if (referrers.length === 0) throw "No highscore referrer entries.";
    return referrers;
  }

  rowAdder(user: Referrer): void {
    addDBReferrerRowToTable(this.resultTable, user);
  }
}
