const rM = require("../misc/RoleManagement")
const aE = require("../misc/answerEmbedding")


function addHelpToTable(tableBase, command, functionality, example) {
    tableBase[0].value = command;
    tableBase[1].value = functionality;
    tableBase[2].value = "Example: " + example;

}

/**
 * Checks if user is admin or normal user and give helping embedding for each
 * 
 */
module.exports = async (message) => {

    // table for embed
    var tableBase = [
        {
            name: 'Command',
            value: '',
            inline: true,
        },
        {
            name: 'Function',
            value: '',
            inline: true,
        },
        {
            name: 'Example',
            value: '',
            inline: true,
        }
    ];

    // create embed
    embed = aE.generateEmbedding("Bot commands", "", "");

    // help beginner commands
	if (roleManagement.findRole(message, roleManagement.beginnerRoles) != undefined) {
        addHelpToTable( tableBase, 
            "!join <lobbytype> <positions>", 
            "Joins an open lobby.\n Lobby types are: " + Object.keys(c.lobbyTypes).join(", ") + "\n Allowed positions are 1,2,3,4,5",
            "'!join " + Object.keys(c.lobbyTypes) + "1,2'" );
                
        addHelpToTable( tableBase, 
            "!withdraw <lobbytype>", 
            "Withdraws from a lobby.\n Lobby types are: " + Object.keys(c.lobbyTypes).join(", "),
            "'!withdraw " + Object.keys(c.lobbyTypes));
            
        addHelpToTable( tableBase, 
            "!correct <lobbytype> <positions>", 
            "Adjusts the positions you want to play in a lobby after you joined.\n Lobby types are: " + Object.keys(c.lobbyTypes).join(", ")+ "\n Allowed positions are 1,2,3,4,5",
            "'!correct " + Object.keys(c.lobbyTypes)+ "3,5,4'");

        addHelpToTable( tableBase, 
            "!status", 
            "Gives you the status of your assignment to lobbies in the current channel",
            "'!status");

        addHelpToTable( tableBase, 
            "!help", 
            "Shows you the info you are looking at right now 😉",
            "'!help");
    }
    
    // help admin commands
	if (roleManagement.findRole(message, roleManagement.beginnerRoles) != undefined) {

	// } else if (	content.startsWith("!post") || 
    // content.startsWith("!start") || 
    // content.startsWith("!f_start") || 
    // content.startsWith("!list") || 
    // content.startsWith("!clear") || 
    // content.startsWith("!cancel")) {
        addHelpToTable( tableBase, 
            "!join <lobbytype> <positions>", 
            "Joins an open lobby.\n Lobby types are: " + Object.keys(c.lobbyTypes).join(", ") + "\n Allowed positions are 1,2,3,4,5",
            "'!join " + Object.keys(c.lobbyTypes) + "1,2'" );
                
        addHelpToTable( tableBase, 
            "!withdraw <lobbytype>", 
            "Withdraws from a lobby.\n Lobby types are: " + Object.keys(c.lobbyTypes).join(", "),
            "'!withdraw " + Object.keys(c.lobbyTypes));
            
        addHelpToTable( tableBase, 
            "!correct <lobbytype> <positions>", 
            "Adjusts the positions you want to play in a lobby after you joined.\n Lobby types are: " + Object.keys(c.lobbyTypes).join(", ")+ "\n Allowed positions are 1,2,3,4,5",
            "'!correct " + Object.keys(c.lobbyTypes)+ "3,5,4'");

        addHelpToTable( tableBase, 
            "!status", 
            "Gives you the status of your assignment to lobbies in the current channel",
            "'!status");

        addHelpToTable( tableBase, 
            "!help", 
            "Shows you the info you are looking at right now 😉",
            "'!help");
    }

    embed.fields = tableBase;

}