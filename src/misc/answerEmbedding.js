"use strict";
const Discord = require("discord.js");
module.exports = {
    /**
     * Generate embedding given the content
     * @param {string} _title title
     * @param {string} _text text
     * @param {string} _footer footer
     * @param {Array<string>} [table] optional table
     */
    generateEmbedding: function (_title, _text, _footer, table = []) {
        return new Discord.MessageEmbed({
            title: _title,
            description: _text,
            fields: table,
            footer: {
                text: _footer,
            },
            timestamp: new Date(),
        });
    },
};
