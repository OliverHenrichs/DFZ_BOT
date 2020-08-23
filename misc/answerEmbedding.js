
const Discord = require('discord.js');

module.exports = {

    /**
     * Generate embedding given the content
     * @param {*} _title title
     * @param {*} _text text
     * @param {*} _footer footer 
     * @param {*} table optional table
     */
    generateEmbedding: function (_title, _text, _footer, table = []) {
        return  {
            title: _title,
            description: _text,
            fields: table,
            footer: {
                text: _footer
            }
        };
        
    }
}