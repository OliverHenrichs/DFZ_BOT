import { RowDataPacket } from "mysql2/promise";
import { SQLResultConverter } from "../database/SQLResultConverter";
import { Referrer } from "../serializables/referrer";
import { Serializer } from "./Serializer";
import { IGuildDataBaseClient } from "./types/IGuildDataBaseClient";
import { ReferrerSerializerIds } from "./types/ReferrerSerializerIds";

export class ReferrerSerializer extends Serializer<Referrer> {
  tag: string;

  constructor(gdbc: IGuildDataBaseClient, tag: string = "") {
    super({
      dbClient: gdbc.dbClient,
      guildId: gdbc.guildId,
      table: referrerTable,
      columns: referrerColumns,
      sortColumn: ReferrerSerializerIds.refCountColumn,
    });
    this.tag = tag;
  }

  protected getSerializeValues(referrer: Referrer): string[] {
    return [referrer.userId, referrer.tag, referrer.referralCount.toString()];
  }

  protected getTypeArrayFromSQLResponse(response: RowDataPacket[]): Referrer[] {
    return SQLResultConverter.mapToDataArray<Referrer>(response, Referrer);
  }

  protected getCondition(): string[] {
    return [`${ReferrerSerializerIds.tagColumn} = '${this.tag}'`];
  }

  protected getSerializableCondition(serializable: Referrer): string[] {
    return [`${ReferrerSerializerIds.tagColumn} = '${serializable.tag}'`];
  }

  protected getDeletionIdentifierColumns(): string[] {
    return [ReferrerSerializerIds.tagColumn];
  }

  protected getSerializableDeletionValues(referreres: Referrer[]): string[] {
    return referreres.map((referrer) => `'${referrer.tag}'`);
  }
}

const referrerTable = ReferrerSerializerIds.table;

const referrerColumns = [
  ReferrerSerializerIds.userColumn,
  ReferrerSerializerIds.tagColumn,
  ReferrerSerializerIds.refCountColumn,
];
