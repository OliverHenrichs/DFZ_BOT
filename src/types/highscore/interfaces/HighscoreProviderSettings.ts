import { IFieldElement } from "../../discord/interfaces/FieldElement";
import { DFZDataBaseClient } from "../../database/DFZDataBaseClient";
import { HighscoreUserTypes } from "../enums/HighscoreUserTypes";

export interface IHighscoreProviderSettings {
  dbClient: DFZDataBaseClient;
  tableTemplate: IFieldElement[];
  userType: HighscoreUserTypes;
}
