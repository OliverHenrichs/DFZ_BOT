import { Pool } from "mysql2/promise";
import {
  CoachHighscoreProvider,
  HighscoreUserTypes,
  PlayerHighscoreProvider,
  ReferrerHighscoreProvider,
} from "../HighscoreProvider";

export default function (userType: HighscoreUserTypes, dbHandle: Pool) {
  switch (userType) {
    case HighscoreUserTypes.players:
      return new PlayerHighscoreProvider(dbHandle);
    case HighscoreUserTypes.coaches:
      return new CoachHighscoreProvider(dbHandle);
    case HighscoreUserTypes.referrers:
      return new ReferrerHighscoreProvider(dbHandle);
  }
}
