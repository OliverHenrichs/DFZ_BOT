import { IFieldElement } from "../../discord/interfaces/IFieldElement";
import { DFZDataBaseClient } from "../../database/DFZDataBaseClient";
import { HighScoreUserTypes } from "../enums/HighScoreUserTypes";

export interface IHighScoreProviderSettings {
  dbClient: DFZDataBaseClient;
  tableTemplate: IFieldElement[];
  userType: HighScoreUserTypes;
}
