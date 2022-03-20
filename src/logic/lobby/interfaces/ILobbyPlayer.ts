export interface ILobbyPlayer {
  name: string;
  id: string;
  positions: Array<number>;
  tier: ILobbyTier;
  region: ILobbyRegion;
}

interface ILobbyRegion {
  id: string;
  name: string | number;
}

interface ILobbyTier {
  id: string;
  number: number;
  name: string;
}
