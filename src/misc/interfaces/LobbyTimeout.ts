import { Lobby } from "../../types/serializables/lobby";

export interface LobbyTimeout {
  lobby: Lobby;
  timeout: NodeJS.Timeout;
}
