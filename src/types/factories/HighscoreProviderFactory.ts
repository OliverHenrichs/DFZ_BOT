import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import {
  CoachHighscoreProvider,
  HighscoreUserTypes,
  PlayerHighscoreProvider,
  ReferrerHighscoreProvider,
} from "../HighscoreProvider";

export default function (
  userType: HighscoreUserTypes,
  dbClient: DFZDataBaseClient
) {
  switch (userType) {
    case HighscoreUserTypes.players:
      return new PlayerHighscoreProvider(dbClient);
    case HighscoreUserTypes.coaches:
      return new CoachHighscoreProvider(dbClient);
    case HighscoreUserTypes.referrers:
      return new ReferrerHighscoreProvider(dbClient);
  }
}
