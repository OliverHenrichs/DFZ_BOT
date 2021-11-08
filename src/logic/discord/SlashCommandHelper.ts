import {
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  MessageSelectOptionData,
  Role,
} from "discord.js";
import { getLobbyNameByType, getLobbyTypeByString } from "../../misc/constants";
import { Lobby } from "../serializables/lobby";
import { ChannelManager as DFZChannelManager } from "./DFZChannelManager";
import { DFZDiscordClient } from "./DFZDiscordClient";
import { INamedRole } from "./interfaces/INamedRole";
import { ISelectMenuOptions } from "./interfaces/ISelectMenuOptions";

export class SlashCommandHelper {
  public static addGoAndCancelButtons(
    goButtonId: string,
    goButtonName: string
  ): MessageActionRow {
    return new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId(goButtonId)
        .setLabel(goButtonName)
        .setStyle("PRIMARY"),
      new MessageButton()
        .setCustomId("cancel")
        .setLabel("Cancel")
        .setStyle("DANGER")
    );
  }

  public static createSelectMenu(
    options: ISelectMenuOptions
  ): MessageSelectMenu {
    let menu = new MessageSelectMenu()
      .setCustomId(options.customId)
      .setPlaceholder(options.placeHolder)
      .addOptions(options.selectOptions);
    if (options.minValues !== undefined)
      menu = menu.setMinValues(options.minValues);
    if (options.maxValues !== undefined)
      menu = menu.setMaxValues(options.maxValues);
    return menu;
  }

  public static getRoleSelectOption(role: Role): MessageSelectOptionData {
    return this.getSelectOption(role.name, role.id);
  }

  public static getLobbyTypeSelectOption(
    lobbyType: string
  ): MessageSelectOptionData {
    const value = getLobbyTypeByString(lobbyType).toString();
    return this.getSelectOption(lobbyType, value);
  }

  public static getNumberAsSelectOption(num: number): MessageSelectOptionData {
    const numberAsString = num.toString();
    return this.getSelectOption(numberAsString, numberAsString);
  }

  public static async getChannelSelectOptions(
    channelId: string,
    client: DFZDiscordClient
  ): Promise<MessageSelectOptionData> {
    const channel = await DFZChannelManager.getChannel(client, channelId);
    return this.getSelectOption(channel.name, channelId);
  }

  public static getLobbySelectOption(lobby: Lobby): MessageSelectOptionData {
    return this.getSelectOption(
      getLobbyNameByType(lobby.type) +
        " lobby at " +
        new Date(lobby.date).toTimeString(),
      lobby.messageId
    );
  }

  public static getOptionChoicesByNamedRole(
    namedRoles: INamedRole[]
  ): [string, string][] {
    return namedRoles.map((namedRole) => [namedRole.name, namedRole.id]);
  }

  public static getOptionChoices<T>(
    keys: string[],
    valueGetter: (key: string) => T
  ): [string, T][] {
    const values = keys.map((key) => valueGetter(key));
    return this.createChoiceList<T>(keys, values);
  }

  public static getOptionStringChoices(keyVals: string[]) {
    return this.createChoiceList<string>(keyVals, keyVals);
  }

  public static getOptionNumberChoices(choiceValueList: number[]) {
    const keys = choiceValueList.map((val) => val.toString());
    return this.createChoiceList<number>(keys, choiceValueList);
  }

  public static createChoiceList<T>(
    keys: string[],
    values: T[]
  ): [string, T][] {
    if (keys.length !== values.length) {
      return [];
    }

    const typeChoiceList: [string, T][] = [];
    keys.forEach((keyValue, index) => {
      typeChoiceList.push([keyValue, values[index]]);
    });
    return typeChoiceList;
  }

  private static getSelectOption(
    label: string,
    value: string
  ): MessageSelectOptionData {
    return {
      label,
      description: "",
      value,
    };
  }
}
