export interface LobbyPlayer {
  name: string;
  id: string;
  positions: Array<number>;
  tier: LobbyTier;
  region: LobbyRegion;
}

interface LobbyRegion {
  id: string;
  name: string | number;
}

interface LobbyTier {
  id: string;
  number: number;
  name: string;
}
