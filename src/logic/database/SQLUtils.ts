import * as mysql from "mysql";

export class SQLUtils {
  public static escape(input: string | undefined) {
    if (!input) return "";
    let escaped = mysql.escape(input);
    if (escaped.startsWith("'")) {
      escaped = escaped.substring(1);
    }
    if (escaped.endsWith("'")) {
      escaped = escaped.substring(0, escaped.length - 1);
    }

    return escaped;
  }
}
