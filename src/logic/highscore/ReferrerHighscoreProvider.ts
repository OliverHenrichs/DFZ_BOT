import { AbstractHighscoreProvider } from "./AbstractHighscoreProvider";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { IFieldElement } from "../discord/interfaces/IFieldElement";
import { HighscoreUserTypes } from "./enums/HighscoreUserTypes";
import { IHighscoreProviderSettings } from "./interfaces/HighscoreProviderSettings";
import { Referrer } from "../serializables/referrer";
import { ReferrerSerializer } from "../serializers/referrerSerializer";

export class ReferrerHighscoreProvider extends AbstractHighscoreProvider<Referrer> {
  constructor(dbClient: DFZDataBaseClient) {
    const settings: IHighscoreProviderSettings = {
      dbClient: dbClient,
      tableTemplate: tableBaseReferrersTemplate,
      userType: HighscoreUserTypes.referrers,
    };

    super(settings);
  }

  protected async getUsersFromDatabase() {
    const serializer = new ReferrerSerializer(this.dbClient);
    const referrers = await serializer.getSorted();
    if (referrers.length === 0) throw "No highscore referrer entries.";
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
