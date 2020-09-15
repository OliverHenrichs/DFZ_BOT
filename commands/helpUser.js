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
            name: 'Example',
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
 * Checks if user is admin or normal user and give helping embedding for each
 * 
 */
module.exports = async (message) => {
    // create embed
    var _embed = aE.generateEmbedding("Bot commands", "", "");

    addHelpToTable( _embed, "help", 
    "!help / !helpme", 
    "Shows you the info you are looking at right now 😉\n Use !helpme to avoid also getting a message from MEE6-bot.",
    "!help");

    // help beginner commands
	if (rM.findRole(message.member, rM.beginnerRoles) != undefined) {
        addHelpToTable( _embed, "join", 
            "!join <lobbytype> <positions>", 
            "Joins an open lobby.\n Lobby types are: " + Object.keys(c.lobbyTypes).join(", ") + "\n Allowed positions are 1,2,3,4,5",
            "!join " + Object.keys(c.lobbyTypes)[0] + " 1,2" );
                
        addHelpToTable( _embed, "withdraw", 
            "!withdraw <lobbytype>", 
            "Withdraws from a lobby.\n Lobby types are: " + Object.keys(c.lobbyTypes).join(", "),
            "!withdraw " + Object.keys(c.lobbyTypes)[1]);
            
        addHelpToTable( _embed, "correct", 
            "!correct <lobbytype> <positions>", 
            "Adjusts the positions you want to play in a lobby after you joined.\n Lobby types are: " + Object.keys(c.lobbyTypes).join(", ")+ "\n Allowed positions are 1,2,3,4,5",
            "!correct " + Object.keys(c.lobbyTypes)[2]+ " 3,5,4");

        addHelpToTable( _embed, "status", 
            "!status", 
            "Gives you the status of your assignment to lobbies in the current channel",
            "!status");
            
        addHelpToTable( _embed, "time", 
            "!time <lobbytype> <timezone>", 
            "Shows you the time of the lobby in your timezone. Check https://kevinnovak.github.io/Time-Zone-Picker/ to find your time zone name.",
            "!time " + Object.keys(c.lobbyTypes)[2]+ " Asia/Manila");
}
    
    // help admin commands
    else if (rM.findRole(message.member, rM.adminRoles) != undefined) 
    {
        addHelpToTable( _embed, "post", 
            "!post <lobbytype> <tiers> <time> <timezone>", 
            "Creates a lobby in this channel.\n Lobby types are: " + Object.keys(c.lobbyTypes).join(", ")+"\n Allowed tiers: 1,2,3,4\n time format: 1-12:00-59am/pm \n timezone: CET, ... check https://en.wikipedia.org/wiki/List_of_tz_database_time_zones or https://kevinnovak.github.io/Time-Zone-Picker/",
            "!post " + Object.keys(c.lobbyTypes)[1]+" 1,2 9:55pm GMT+2 \n!post " + Object.keys(c.lobbyTypes)[2]+" 4,3 7:00am Europe/Moscow");
        addHelpToTable( _embed, "start", 
            "!start <lobbytype>", 
            "Starts the scheduled lobby in this channel.\n Lobby types are: " + Object.keys(c.lobbyTypes).join(", "),
            "!start " + Object.keys(c.lobbyTypes)[0]);
                
        addHelpToTable( _embed, "f_start", 
            "!f_start <lobbytype>", 
            "Same as start, but also works if there are not enough players",
            "!f_start " + Object.keys(c.lobbyTypes)[1]);
            
        addHelpToTable( _embed, "list", 
            "!list <lobbytype>", 
            "List current players for the given lobby.\n Lobby types are: " + Object.keys(c.lobbyTypes).join(", "),
            "!list " + Object.keys(c.lobbyTypes)[0]);

        addHelpToTable( _embed, "clear", 
            "!clear <lobbytype>", 
            "Resets lobby by clearing all players.\n Lobby types are: " + Object.keys(c.lobbyTypes).join(", "),
            "'!clear " + Object.keys(c.lobbyTypes)[0]);

        addHelpToTable( _embed, "time", 
            "!time <lobbytype> <timezone>", 
            "Shows you the time of the lobby in your timezone. Check https://kevinnovak.github.io/Time-Zone-Picker/ to find your time zone name.",
            "!time " + Object.keys(c.lobbyTypes)[2]+ " Asia/Manila");

        addHelpToTable( _embed, "remove", 
            "!undo <lobbytype>", 
            "Cancels the lobby. \n Lobby types are: " + Object.keys(c.lobbyTypes).join(", "),
            "!undo " + Object.keys(c.lobbyTypes)[0]);
    }

    message.author.send({embed: _embed});
    mH.reactPositive(message, "");
}