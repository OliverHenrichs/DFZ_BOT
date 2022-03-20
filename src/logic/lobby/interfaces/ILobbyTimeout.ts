import { Lobby } from "../../serializables/Lobby";

export interface ILobbyTimeout {
  lobby: Lobby;
  timeout: NodeJS.Timeout;
}
