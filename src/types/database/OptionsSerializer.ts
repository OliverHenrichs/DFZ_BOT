import { RowDataPacket, OkPacket } from "mysql2";
import { DFZDataBaseClient, SQLReturnValue } from "./DFZDataBaseClient";

export async function insertDay(client: DFZDataBaseClient, day: number) {
  return client.insertRow("options", [
    { columnName: "name", value: "day" },
    { columnName: "value", value: day },
  ]);
}

export async function updateDay(client: DFZDataBaseClient, day: number) {
  return client.updateRows(
    "options",
    [{ columnName: "value", value: day }],
    ["name = 'day'"]
  );
}

export async function getDay(client: DFZDataBaseClient) {
  return new Promise<number>(function (resolve, reject) {
    client.selectRows(
      "options",
      ["value"],
      ["name = 'day'"],
      (res: SQLReturnValue) => {
        console.log("get Day return value: " + JSON.stringify(res.data));
        if (
          !Array.isArray(res.data) ||
          res.data.length === 0 ||
          !hasValue(res.data[0])
        )
          resolve(NaN);
        else {
          resolve(parseInt(res.data[0].value));
        }
      }
    );
  });
}

function hasValue(
  response: RowDataPacket | RowDataPacket[] | OkPacket
): response is RowDataPacket {
  if ("value" in response) {
    return true;
  }
  return false;
}
