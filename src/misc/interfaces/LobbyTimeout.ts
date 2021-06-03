import { Lobby } from "../types/lobby";

export interface LobbyTimeout {
  lobby: Lobby;
  timeout: NodeJS.Timeout;
}
