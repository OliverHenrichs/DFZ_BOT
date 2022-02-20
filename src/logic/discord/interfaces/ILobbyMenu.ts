import { Lobby } from "../../serializables/Lobby";
import { MenuType } from "../enums/MenuType";

export interface ILobbyMenu {
  type: MenuType;
  lobby?: Lobby;
  id: string;
}
