
const Discord = require('discord.js');

/**
 * TODO: Fix this, colors dont work like that
 */
var colormap = new Map([["success", "#00FF00"], ["failure", '#FF0000'], ["warning", '#FFFF00']]);

/** */
module.exports = {

    /**
     * Generate embedding given the content
     * @param {*} _title title
     * @param {*} _text text
     * @param {*} _footer footer 
     * @param {*} _type color type
     * @param {*} table optional table
     */
    generateEmbedding: function (_title, _text, _footer, _type, table = []) {
        return  {
            color: colormap[_type],
            title: _title,
            description: _text,
            fields: table,
            footer: {
                text: _footer
            }
        };
        
    }
}