import { Lobby } from "../../serializables/lobby";

export interface LobbyTimeout {
  lobby: Lobby;
  timeout: NodeJS.Timeout;
}
