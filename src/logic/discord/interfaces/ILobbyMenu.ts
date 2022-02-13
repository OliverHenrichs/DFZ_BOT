import { Lobby } from "../../serializables/lobby";
import { MenuType } from "./MenuType";

export interface ILobbyMenu {
  type: MenuType;
  lobby?: Lobby;
  id: string;
}
