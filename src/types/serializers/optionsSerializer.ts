import { RowDataPacket } from "mysql2/promise";
import { DFZDataBaseClient } from "../database/DFZDataBaseClient";

export async function insertDay(client: DFZDataBaseClient, day: number) {
  return client.insertRow(optionsTableName, [
    { columnName: dayOptionNameColumnName, value: dayOptionNameValue },
    { columnName: dayOptionValueColumnName, value: day },
  ]);
}

export async function updateDay(client: DFZDataBaseClient, day: number) {
  return client.updateRows(
    optionsTableName,
    [{ columnName: dayOptionValueColumnName, value: day }],
    dayIdentifier
  );
}

export async function getDay(client: DFZDataBaseClient) {
  return new Promise<number>(function (resolve, _reject) {
    client.selectRows(
      optionsTableName,
      [dayOptionValueColumnName],
      dayIdentifier,
      (res: RowDataPacket[]) => {
        getDayCallback(res, resolve);
      }
    );
  });
}

const optionsTableName = "options";
const dayOptionNameColumnName = "name";
const dayOptionValueColumnName = "value";
const dayOptionNameValue = "day";
const dayIdentifier = [`${dayOptionNameColumnName} = '${dayOptionNameValue}'`];

function getDayCallback(
  sqlValue: RowDataPacket[],
  resolve: (value: number | PromiseLike<number>) => void
) {
  if (!hasDay(sqlValue)) return resolve(NaN);
  resolve(retrieveDayFromSqlValue(sqlValue));
}

function hasDay(sqlValue: RowDataPacket[]) {
  return sqlValue.length !== 0;
}

function retrieveDayFromSqlValue(sqlValue: RowDataPacket[]) {
  return parseInt(sqlValue[0].value);
}
