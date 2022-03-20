import { IFieldElement } from "../discord/interfaces/IFieldElement";
import { ILobbyPlayer } from "./interfaces/ILobbyPlayer";

export abstract class TableGenerator {
  mentionPlayers: boolean = false;

  protected constructor(mentionPlayers: boolean) {
    this.mentionPlayers = mentionPlayers;
  }

  private static addUserNameToUserTable(
    tableBase: Array<IFieldElement>,
    user: ILobbyPlayer,
    startIndex = 0,
    mention = false
  ) {
    tableBase[startIndex].value = `${tableBase[startIndex].value}\r\n${
      user.region.name !== "" ? `[${user.region.name}]` : ""
    }${mention ? `<@${user.id}>` : user.name}`;
  }

  private static addUserPositionsToUserTable(
    tableBase: Array<IFieldElement>,
    positions: Array<number>,
    startIndex = 0
  ) {
    tableBase[startIndex + 1].value = `${tableBase[startIndex + 1].value}
${positions.length === 1 && positions[0] === -1 ? "-" : positions.join(", ")}`;
  }

  private static addTierToUserTable(
    tableBase: Array<IFieldElement>,
    user: ILobbyPlayer,
    startIndex = 0
  ) {
    tableBase[startIndex + 2].value = `${tableBase[startIndex + 2].value}
${user.tier.name}`;
  }

  abstract generate(): IFieldElement[];

  /**
   *  adds user + position + tier to team table
   *  @param tableBase table to which data is added
   *  @param index table index at which data is added
   *  @param player user to add
   *  @param position position of user to add
   *  @param mention if true mentions the user in the table
   */
  protected addUserToTeam(
    tableBase: Array<IFieldElement>,
    index: number,
    player: ILobbyPlayer,
    position: number,
    mention: boolean
  ) {
    this.addUserWithPositionsToUserTable(
      tableBase,
      player,
      [position],
      index,
      mention
    );
  }

  protected addUserWithPositionsToUserTable(
    tableBase: Array<IFieldElement>,
    user: ILobbyPlayer,
    positions: Array<number>,
    startIndex = 0,
    mention = false
  ) {
    TableGenerator.addUserNameToUserTable(tableBase, user, startIndex, mention);

    TableGenerator.addUserPositionsToUserTable(
      tableBase,
      positions,
      startIndex
    );

    TableGenerator.addTierToUserTable(tableBase, user, startIndex);
  }
}
