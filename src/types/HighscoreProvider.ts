import { Message } from "discord.js";
import { Pool } from "mysql2/promise";
import { generateEmbedding } from "../misc/answerEmbedding";
import { lobbyTypes } from "../misc/constants";
import {
  getSortedPlayers,
  getSortedCoaches,
  getSortedReferrers,
} from "../misc/database";
import {
  tableBasePlayersTemplate,
  addDBPlayerRowToTable,
  tableBaseCoachesTemplate,
  addDBCoachRowToTable,
  tableBaseReferrersTemplate,
  addDBReferrerRowToTable,
} from "../misc/highScoreTables";
import { FieldElement } from "../misc/interfaces/EmbedInterface";
import { reactPositive } from "../misc/messageHelper";
import { Coach } from "../misc/types/coach";
import { Player } from "../misc/types/player";
import { Referrer } from "../misc/types/referrer";

export enum HighscoreUserTypes {
  players = "players",
  coaches = "coaches",
  referrers = "referrers",
}

interface HighscoreProviderSettings {
  dbHandle: Pool;
  tableTemplate: FieldElement[];
  userType: HighscoreUserTypes;
}

abstract class AbstractHighscoreProvider<T> {
  dbHandle: Pool;
  dbColumnName: string;
  resultTable: FieldElement[];
  userType: HighscoreUserTypes;

  constructor(settings: HighscoreProviderSettings) {
    this.dbHandle = settings.dbHandle;
    this.dbColumnName = this.getDBColumnName();
    this.resultTable = JSON.parse(JSON.stringify(settings.tableTemplate)); // deep copy...
    this.userType = settings.userType;
  }
  abstract getDBColumnName(): string;

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
  constructor(dbHandle: Pool) {
    const settings: HighscoreProviderSettings = {
      dbHandle: dbHandle,
      tableTemplate: tableBasePlayersTemplate,
      userType: HighscoreUserTypes.players,
    };

    super(settings);
  }

  getDBColumnName(): string {
    return "lobbyCount";
  }

  async getUsersFromDatabase() {
    const players = await getSortedPlayers(this.dbHandle, this.dbColumnName);
    if (players.length === 0) throw "No highscore player entries.";
    return players;
  }

  rowAdder(user: Player): void {
    addDBPlayerRowToTable(this.resultTable, user);
  }
}

export class CoachHighscoreProvider extends AbstractHighscoreProvider<Coach> {
  constructor(dbHandle: Pool) {
    const settings: HighscoreProviderSettings = {
      dbHandle: dbHandle,
      tableTemplate: tableBaseCoachesTemplate,
      userType: HighscoreUserTypes.coaches,
    };

    super(settings);
  }

  getDBColumnName(): string {
    return "lobbyCount";
  }

  async getUsersFromDatabase() {
    const coaches = await getSortedCoaches(this.dbHandle, this.dbColumnName);
    if (coaches.length === 0) throw "No highscore coach entries.";
    return coaches;
  }

  rowAdder(user: Coach): void {
    addDBCoachRowToTable(this.resultTable, user);
  }
}

export class ReferrerHighscoreProvider extends AbstractHighscoreProvider<Referrer> {
  constructor(dbHandle: Pool) {
    const settings: HighscoreProviderSettings = {
      dbHandle: dbHandle,
      tableTemplate: tableBaseReferrersTemplate,
      userType: HighscoreUserTypes.referrers,
    };

    super(settings);
  }

  getDBColumnName(): string {
    return "referralCount";
  }

  async getUsersFromDatabase() {
    const referrers = await getSortedReferrers(
      this.dbHandle,
      this.dbColumnName
    );
    if (referrers.length === 0) throw "No highscore referrer entries.";
    return referrers;
  }

  rowAdder(user: Referrer): void {
    addDBReferrerRowToTable(this.resultTable, user);
  }
}
