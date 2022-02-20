import { lobbyTypes } from "../../misc/constants";
import { ILobbyPlayer } from "./interfaces/ILobbyPlayer";
import { IFieldElement } from "../discord/interfaces/IFieldElement";
import { TableGenerator } from "./TableGenerator";

export class TeamsTableGenerator extends TableGenerator {
  users: ILobbyPlayer[][];
  lobbyType: number;

  constructor(
    users: ILobbyPlayer[][],
    lobbyType: number,
    mentionPlayers: boolean = false
  ) {
    super(mentionPlayers);
    this.lobbyType = lobbyType;
    this.users = users;
  }

  private static createInhouseTableBase() {
    return [
      {
        name: "Side",
        value: "Radiant",
        inline: false,
      },
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
      {
        name: "Side",
        value: "Dire",
        inline: false,
      },
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

  private static createOneTeamTableBase() {
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

  public generate(): IFieldElement[] {
    switch (this.lobbyType) {
      case lobbyTypes.inhouse:
        return this.createInhouseTeams();
      case lobbyTypes.unranked:
      case lobbyTypes.botbash:
      case lobbyTypes.tryout:
        return this.createFivePeopleTeam();
      default:
        return [];
    }
  }

  private createInhouseTeams() {
    const tableBaseInhouse = TeamsTableGenerator.createInhouseTableBase();
    for (let pos = 0; pos < 5; pos++) {
      const players = this.users[pos];
      const teamAIndex = 1;
      const teamBIndex = 5;
      this.addUserToTeam(
        tableBaseInhouse,
        teamAIndex,
        players[0],
        pos + 1,
        this.mentionPlayers
      );
      this.addUserToTeam(
        tableBaseInhouse,
        teamBIndex,
        players[1],
        pos + 1,
        this.mentionPlayers
      );
    }

    return tableBaseInhouse;
  }

  private createFivePeopleTeam() {
    const tableBase = TeamsTableGenerator.createOneTeamTableBase();

    const teamIndex = 0;
    for (let pos = 0; pos < 5; pos++) {
      const players = this.users[pos];
      this.addUserToTeam(
        tableBase,
        teamIndex,
        players[0],
        pos + 1,
        this.mentionPlayers
      );
    }

    return tableBase;
  }
}
