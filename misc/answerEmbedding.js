
const Discord = require('discord.js');

var colormap = new Map([["success", '#00FF00'], ["failure", '#FF0000'], ["warning", '#FFFF00']]);
module.exports = {
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