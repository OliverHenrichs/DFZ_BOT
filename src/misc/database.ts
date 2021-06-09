import { createPool } from "mysql2/promise";

export function createDBHandle() {
  console.log(
    `trying to connect to MYSQL-DB on \nhost ${process.env.MYSQL_HOST}\nuser ${process.env.MYSQL_USER}\npw ${process.env.MYSQL_PASSWORD}\ndb ${process.env.MYSQL_DATABASE}\n`
  );

  return createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}
