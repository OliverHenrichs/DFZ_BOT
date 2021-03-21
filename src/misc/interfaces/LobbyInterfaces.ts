export interface LobbyRegion {
  id: string;
  name: string | number;
}

export interface LobbyTier {
  id: string;
  number: number;
  name: string;
}

export interface LobbyPlayer {
  name: string;
  id: string;
  positions: Array<number>;
  tier: LobbyTier;
  region: LobbyRegion;
}

export interface PositionPlayers {
  pos: number;
  users: LobbyPlayer[];
}
