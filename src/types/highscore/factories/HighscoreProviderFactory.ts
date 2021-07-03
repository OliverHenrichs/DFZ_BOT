import { DFZDataBaseClient } from "../../database/DFZDataBaseClient";
import { CoachHighscoreProvider } from "../CoachHighscoreProvider";
import { HighscoreUserTypes } from "../enums/HighscoreUserTypes";
import { PlayerHighscoreProvider } from "../PlayerHighscoreProvider";
import { ReferrerHighscoreProvider } from "../ReferrerHighscoreProvider";

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
