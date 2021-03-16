const Discord = require("discord.js");
module.exports = {
    /**
     * Generate embedding given the content
     * @param {string} _title title
     * @param {string} _text text
     * @param {string} _footer footer
     * @param {Array<string>} [table] optional table
     */
    generateEmbedding: function (_title: string, _text: string, _footer: string, table: Array<string> = []) {
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
