import { readFileSync } from "fs";

export function tryGetSSLCredentials(): SSLCredentials {
  try {
    return getSSLCredentials();
  } catch (e) {
    throw new Error("Could not find https-cert, only loading http-server");
  }
}

function getSSLCredentials(): SSLCredentials {
  const credentials: SSLCredentials = {
    key: "",
    cert: "",
    ca: "",
  };

  credentials.key = readFileSync(
    "/etc/letsencrypt/live/dotafromzero.com/privkey.pem",
    "utf8"
  );
  credentials.cert = readFileSync(
    "/etc/letsencrypt/live/dotafromzero.com/cert.pem",
    "utf8"
  );
  credentials.ca = readFileSync(
    "/etc/letsencrypt/live/dotafromzero.com/chain.pem",
    "utf8"
  );

  return credentials;
}

interface SSLCredentials {
  key: string;
  cert: string;
  ca: string;
}
