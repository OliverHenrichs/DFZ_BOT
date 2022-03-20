import { DFZDataBaseClient } from "../../database/DFZDataBaseClient";
import { CoachHighscoreProvider } from "../CoachHighscoreProvider";
import { HighScoreUserTypes } from "../enums/HighScoreUserTypes";
import { PlayerHighscoreProvider } from "../PlayerHighscoreProvider";

export default function (
  userType: HighScoreUserTypes,
  dbClient: DFZDataBaseClient
) {
  switch (userType) {
    case HighScoreUserTypes.players:
      return new PlayerHighscoreProvider(dbClient);
    case HighScoreUserTypes.coaches:
      return new CoachHighscoreProvider(dbClient);
  }
}
