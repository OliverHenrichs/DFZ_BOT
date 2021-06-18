import { DFZDataBaseClient } from "../database/DFZDataBaseClient";
import { RowDataPacket } from "mysql2/promise";
import { Referrer } from "../serializables/referrer";
import { Serializer } from "./serializer";
import { SQLResultConverter } from "../database/SQLResultConverter";

export class ReferrerSerializer extends Serializer<Referrer> {
  tag: string;

  constructor(dbClient: DFZDataBaseClient, tag: string = "") {
    super({
      dbClient: dbClient,
      table: referrerTable,
      columns: referrerColumns,
      sortColumn: sortColumnName,
    });
    this.tag = tag;
  }

  getSerializeValues(referrer: Referrer): string[] {
    return [referrer.userId, referrer.tag, referrer.referralCount.toString()];
  }

  getTypeArrayFromSQLResponse(response: RowDataPacket[]): Referrer[] {
    return SQLResultConverter.mapToDataArray<Referrer>(response, Referrer);
  }

  getCondition(): string[] {
    return [`${idColumnName} = '${this.tag}'`];
  }

  getSerializableCondition(serializable: Referrer): string[] {
    return [`${idColumnName} = '${serializable.tag}'`];
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

const sortColumnName = referrerColumns[2];
