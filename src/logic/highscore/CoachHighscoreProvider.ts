import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { IFieldElement } from "../discord/interfaces/IFieldElement";
import { Coach } from "../serializables/coach";
import { CoachSerializer } from "../serializers/CoachSerializer";
import { SerializeUtils } from "../serializers/SerializeUtils";
import { AbstractHighScoreProvider } from "./AbstractHighScoreProvider";
import { HighscoreUserTypes } from "./enums/HighscoreUserTypes";
import { IHighScoreProviderSettings } from "./interfaces/HighscoreProviderSettings";

export class CoachHighscoreProvider extends AbstractHighScoreProvider<Coach> {
  constructor(dbClient: DFZDataBaseClient) {
    const settings: IHighScoreProviderSettings = {
      dbClient: dbClient,
      tableTemplate: tableBaseCoachesTemplate,
      userType: HighscoreUserTypes.coaches,
    };
    super(settings);
  }

  protected async getUsersFromDatabase(guildId: string) {
    const gdbc = SerializeUtils.getGuildDBClient(guildId, this.dbClient);
    const serializer = new CoachSerializer(gdbc);
    const coaches = await serializer.getSorted();
    if (coaches.length === 0) throw new Error("No highscore coach entries.");
    return coaches;
  }

  protected rowAdder(coach: Coach): void {
    this.addCoachRowToTable(this.resultTable, coach);
  }

  private addCoachRowToTable(tableBase: Array<IFieldElement>, coach: Coach) {
    tableBase[0].value = tableBase[0].value + "\r\n<@" + coach.userId + ">";
    tableBase[1].value = tableBase[1].value + "\r\n" + coach.lobbyCount;
    tableBase[2].value = tableBase[2].value + "\r\n" + coach.lobbyCountNormal;
    tableBase[3].value = tableBase[3].value + "\r\n" + coach.lobbyCountTryout;
    tableBase[4].value =
      tableBase[4].value + "\r\n" + coach.lobbyCountReplayAnalysis;
  }
}

const tableBaseCoachesTemplate: IFieldElement[] = [
  {
    name: "Coach",
    value: "",
    inline: true,
  },
  {
    name: "Total Coached Lobbies",
    value: "",
    inline: true,
  },
  {
    name: "Regular Lobbies",
    value: "",
    inline: true,
  },
  {
    name: "Tryouts",
    value: "",
    inline: true,
  },
  {
    name: "Replay Analyses",
    value: "",
    inline: true,
  },
];
