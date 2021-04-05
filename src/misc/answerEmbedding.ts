import { FieldElement } from "./interfaces/EmbedInterface";
import { MessageEmbed } from "discord.js"
//const Discord = require("discord.js");
  /**
   * Generate embedding given the content
   * @param {string} _title title
   * @param {string} _text text
   * @param {string} _footer footer
   * @param {Array<FieldElement>} [table] optional table
   */
  export function generateEmbedding(
    _title: string,
    _text: string,
    _footer: string,
    table: Array<FieldElement> = []
  ) {
    return new MessageEmbed({
      title: _title,
      description: _text,
      fields: table,
      footer: {
        text: _footer,
      },
      timestamp: new Date(),
    });
  }
