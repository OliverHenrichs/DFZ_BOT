import { IFieldElement } from "../../discord/interfaces/IFieldElement";
import { DFZDataBaseClient } from "../../database/DFZDataBaseClient";
import { HighscoreUserTypes } from "../enums/HighscoreUserTypes";

export interface IHighScoreProviderSettings {
  dbClient: DFZDataBaseClient;
  tableTemplate: IFieldElement[];
  userType: HighscoreUserTypes;
}
