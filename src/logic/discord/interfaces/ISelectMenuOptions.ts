import { MessageSelectOptionData } from "discord.js";

export interface ISelectMenuOptions {
  customId: string;
  placeHolder: string;
  minValues?: number;
  maxValues?: number;
  selectOptions: MessageSelectOptionData[];
}
