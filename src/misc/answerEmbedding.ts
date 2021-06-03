import { FieldElement } from "./interfaces/EmbedInterface";
import { MessageEmbed } from "discord.js";

export function generateEmbedding(
  title: string,
  text: string,
  footer: string,
  table: Array<FieldElement> = []
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
