import {
  DFZDataBaseClient,
  getTypedArrayFromDBResponse,
  SQLReturnValue,
} from "../database/DFZDataBaseClient";
import { Referrer } from "../serializables/referrer";
import { Serializer } from "./serializer";

export class ReferrerSerializer extends Serializer<Referrer> {
  tag: string;

  constructor(dbClient: DFZDataBaseClient, tag: string = "") {
    super({
      dbClient: dbClient,
      table: referrerTable,
      columns: referrerColumns,
      sortColumn: idColumnName,
    });
    this.tag = tag;
  }

  getSerializeValues(referrer: Referrer): string[] {
    return [referrer.userId, referrer.tag, referrer.referralCount.toString()];
  }

  getTypeArrayFromSQLResponse(response: SQLReturnValue): Referrer[] {
    return getTypedArrayFromDBResponse<Referrer>(response, Referrer);
  }

  getSerializableCondition(): string[] {
    return [`${idColumnName} = '${this.tag}'`];
  }

  getDeletionIdentifierColumns(): string[] {
    return [idColumnName];
  }

  getSerializableDeletionValues(referreres: Referrer[]): string[] {
    return referreres.map((referrer) => `'${referrer.tag}'`);
  }
}

const referrerTable = "referrers";

const referrerColumns = ["userId", "tag", "referralCount"];

const idColumnName = referrerColumns[1];
