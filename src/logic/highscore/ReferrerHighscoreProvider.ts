import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { IFieldElement } from "../discord/interfaces/IFieldElement";
import { Referrer } from "../serializables/referrer";
import { ReferrerSerializer } from "../serializers/ReferrerSerializer";
import { AbstractHighscoreProvider } from "./AbstractHighscoreProvider";
import { HighscoreUserTypes } from "./enums/HighscoreUserTypes";
import { IHighscoreProviderSettings } from "./interfaces/HighscoreProviderSettings";

export class ReferrerHighscoreProvider extends AbstractHighscoreProvider<Referrer> {
  constructor(dbClient: DFZDataBaseClient) {
    const settings: IHighscoreProviderSettings = {
      dbClient: dbClient,
      tableTemplate: tableBaseReferrersTemplate,
      userType: HighscoreUserTypes.referrers,
    };

    super(settings);
  }

  protected async getUsersFromDatabase(guildId: string) {
    const serializer = new ReferrerSerializer({
      dbClient: this.dbClient,
      guildId,
    });
    const referrers = await serializer.getSorted();
    if (referrers.length === 0)
      throw new Error("No highscore referrer entries.");
    return referrers;
  }

  protected rowAdder(user: Referrer): void {
    this.addReferrerRowToTable(this.resultTable, user);
  }

  private addReferrerRowToTable(
    tableBase: Array<IFieldElement>,
    referrer: Referrer
  ) {
    tableBase[0].value = tableBase[0].value + "\r\n" + referrer.tag;
    tableBase[1].value = tableBase[1].value + "\r\n" + referrer.referralCount;
  }
}

const tableBaseReferrersTemplate: IFieldElement[] = [
  {
    name: "Referrer",
    value: "",
    inline: true,
  },
  {
    name: "Referral Count",
    value: "",
    inline: true,
  },
];
