import {
  anyNumberOfPlayers,
  getPlayersPerLobbyByLobbyType,
} from "../../misc/constants";
import { IFieldElement } from "../discord/interfaces/IFieldElement";
import { LobbyPlayer } from "./interfaces/LobbyPlayer";
import { TableGenerator } from "./TableGenerator";

export class UserTableGenerator extends TableGenerator {
  users: LobbyPlayer[];
  playersPerLobby: number;

  constructor(
    users: LobbyPlayer[],
    lobbyType: number,
    mentionPlayers: boolean = false
  ) {
    super(mentionPlayers);
    this.playersPerLobby = getPlayersPerLobbyByLobbyType(lobbyType);
    this.users = users;
  }

  private static createUserTableBase(): Array<IFieldElement> {
    return [
      {
        name: "Name",
        value: "",
        inline: true,
      },
      {
        name: "Position",
        value: "",
        inline: true,
      },
      {
        name: "Tier",
        value: "",
        inline: true,
      },
    ];
  }

  private static createUserTableBench(): Array<IFieldElement> {
    return [
      {
        name: "Bench",
        value: "If people leave, you get pushed up",
        inline: false,
      },
    ].concat(UserTableGenerator.createUserTableBase());
  }

  public generate(): IFieldElement[] {
    if (this.users.length == 0) {
      return [];
    }

    const mainTable = UserTableGenerator.createUserTableBase();
    const benchTable = UserTableGenerator.createUserTableBench();

    return this.fillUserTable(mainTable, benchTable);
  }

  private fillUserTable(
    mainTable: IFieldElement[],
    benchTable: IFieldElement[]
  ) {
    let userIndex = 0;
    this.users.forEach((user) => {
      this.handleUserAddition(user, mainTable, benchTable, userIndex);
      userIndex++;
    });

    if (this.hasBenchedPlayers(userIndex)) return mainTable.concat(benchTable);

    return mainTable;
  }

  private hasBenchedPlayers(userIndex: number) {
    return (
      userIndex > this.playersPerLobby &&
      this.playersPerLobby !== anyNumberOfPlayers
    );
  }

  private handleUserAddition(
    user: LobbyPlayer,
    mainTable: IFieldElement[],
    benchTable: IFieldElement[],
    userIndex: number
  ) {
    const tableStartIndexPlayers = 0;
    const tableStartIndexBench = 1;
    if (this.userIsInLobby(userIndex))
      this.addToUserTable(
        mainTable,
        user,
        tableStartIndexPlayers,
        this.mentionPlayers
      );
    else
      this.addToUserTable(
        benchTable,
        user,
        tableStartIndexBench,
        this.mentionPlayers
      );
  }

  private userIsInLobby(userIndex: number) {
    return (
      userIndex < this.playersPerLobby ||
      this.playersPerLobby === anyNumberOfPlayers
    );
  }

  private addToUserTable(
    tableBase: Array<IFieldElement>,
    user: LobbyPlayer,
    startIndex = 0,
    mention = false
  ) {
    this.addUserWithPositionsToUserTable(
      tableBase,
      user,
      user.positions,
      startIndex,
      mention
    );
  }
}
