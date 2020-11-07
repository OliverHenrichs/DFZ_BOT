const c = require("../misc/constants")
const rM = require("../misc/roleManagement")
const aE = require("../misc/answerEmbedding")
const mH = require("../misc/messageHelper")


function addHelpToTable(embed, short, command, functionality, example) {
    // table for embed
    var tableBase = [
        {
            name: short,
            value: '',
            inline: true
        },
        {
            name: 'Example(s)',
            value: '',
            inline: true,
        },
        {
            name: 'Function',
            value: '',
            inline: true
        }
    ];

    tableBase[0].value += command + "\n";
    tableBase[1].value += example + "\n";
    tableBase[2].value += functionality + "\n";

    if(embed.fields.length == 0)
        embed.fields = tableBase;
    else 
        embed.fields = embed.fields.concat(tableBase);
}

/**
 * Returns available bot commands depending on role
 */
module.exports = async (message) => {
    // create embed
    var _embed = aE.generateEmbedding("Bot commands", "", "");

    addHelpToTable( _embed, "help", 
    "!help / !helpme", 
    "Shows you the info you are looking at right now 😉\n Use !helpme to avoid also getting a message from MEE6-bot.",
    "!help");
    
    // help admin commands
    if (rM.findRole(message.member, rM.adminRoles) != undefined) 
    {
        addHelpToTable( _embed, "post", 
            "!post <lobbytype> <region> <tiers> <time> <timezone>", 
            "Creates a lobby in the channel in which you write the command.\n Lobby types: " + Object.keys(c.lobbyTypes).join(", ")+"\n Regions: " + rM.getRegionalRoleStringsForCommand().join(", ")+ "\n Allowed tiers: 1,2,3,4; Give no tiers nor regions for lobby type 'tryout'.\n time format: 1-12:00-59am/pm \n timezone: CET, ... check https://kevinnovak.github.io/Time-Zone-Picker/ to find your timezone name.",
            "!post " + Object.keys(c.lobbyTypes)[0]+" EU 1,2 9:55pm GMT+2 \n\n!post " + Object.keys(c.lobbyTypes)[1]+" SEA 4,3 10:00am Asia/Singapore \n\n!post " + Object.keys(c.lobbyTypes)[3]+" 9:55pm America/New_York");

        // addHelpToTable( _embed, "time", 
        //     "!time <lobbytype> <timezone>", 
        //     "Shows you the scheduled time of the lobby in your timezone. Check https://kevinnovak.github.io/Time-Zone-Picker/ to find your timezone name.",
        //     "!time " + Object.keys(c.lobbyTypes)[2]+ " Asia/Manila");
            
        message.author.send({embed: _embed});
        mH.reactPositive(message, "");
    }
}