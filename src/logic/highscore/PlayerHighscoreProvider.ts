import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { IFieldElement } from "../discord/interfaces/IFieldElement";
import { Player } from "../serializables/player";
import { PlayerSerializer } from "../serializers/PlayerSerializer";
import { AbstractHighscoreProvider } from "./AbstractHighscoreProvider";
import { HighscoreUserTypes } from "./enums/HighscoreUserTypes";
import { IHighscoreProviderSettings } from "./interfaces/HighscoreProviderSettings";

export class PlayerHighscoreProvider extends AbstractHighscoreProvider<Player> {
  constructor(dbClient: DFZDataBaseClient) {
    const settings: IHighscoreProviderSettings = {
      dbClient: dbClient,
      tableTemplate: tableBasePlayersTemplate,
      userType: HighscoreUserTypes.players,
    };

    super(settings);
  }

  protected async getUsersFromDatabase(guildId: string) {
    const serializer = new PlayerSerializer({
      guildId,
      dbClient: this.dbClient,
    });
    const players = await serializer.getSorted();
    if (players.length === 0) throw new Error("No highscore player entries.");
    return players;
  }

  protected rowAdder(user: Player): void {
    this.addPlayerRowToTable(this.resultTable, user);
  }

  private addPlayerRowToTable(tableBase: Array<IFieldElement>, player: Player) {
    tableBase[0].value = tableBase[0].value + "\r\n<@" + player.userId + ">";
    tableBase[1].value = tableBase[1].value + "\r\n" + player.lobbyCount;
    tableBase[2].value =
      tableBase[2].value + "\r\n" + player.lobbyCountUnranked;
    tableBase[3].value = tableBase[3].value + "\r\n" + player.lobbyCount5v5;
    tableBase[4].value = tableBase[4].value + "\r\n" + player.lobbyCountBotBash;
    tableBase[5].value =
      tableBase[5].value + "\r\n" + player.lobbyCountReplayAnalysis;
  }
}

const tableBasePlayersTemplate: IFieldElement[] = [
  {
    name: "Player",
    value: "",
    inline: true,
  },
  {
    name: "Total played",
    value: "",
    inline: true,
  },
  {
    name: "Unranked",
    value: "",
    inline: true,
  },
  {
    name: "5v5",
    value: "",
    inline: true,
  },
  {
    name: "Botbash",
    value: "",
    inline: true,
  },
  {
    name: "Replay Analyses",
    value: "",
    inline: true,
  },
];
