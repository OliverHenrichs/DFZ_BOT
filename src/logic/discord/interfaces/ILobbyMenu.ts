import { Lobby } from "../../serializables/lobby";
import { LobbyMenuType } from "./LobbyMenuType";

export interface ILobbyMenu {
  type: LobbyMenuType;
  lobby: Lobby;
  id: string;
}
