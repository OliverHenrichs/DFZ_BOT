import { IFieldElement } from "./interfaces/IFieldElement";
import { MessageEmbed } from "discord.js";

export class EmbeddingCreator {
  public static create(
    title: string,
    text: string,
    footer: string,
    table: Array<IFieldElement> = []
  ) {
    return new MessageEmbed({
      title: title,
      description: text,
      fields: table,
      footer: {
        text: footer,
      },
      timestamp: new Date(),
    });
  }
}
