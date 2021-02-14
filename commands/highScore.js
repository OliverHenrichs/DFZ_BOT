const aE = require("../misc/answerEmbedding")
const t = require("../misc/tracker")
const mH = require("../misc/messageHelper")

/**
 * 
 * @param {JSON} tableBase 
 * @param {int} startIndex 
 * @param {JSON} dbRow 
 */
function addDBRowToTable(tableBase, dbRow) {
    tableBase[0].value = tableBase[0].value + "\r\n<@" +dbRow.user_id + ">";
    tableBase[1].value = tableBase[1].value + "\r\n" + dbRow.lobbyCount;
    tableBase[2].value = tableBase[2].value + "\r\n" + dbRow.lobbyCountNormal;
    tableBase[3].value = tableBase[3].value + "\r\n" + dbRow.lobbyCountTryout;
}

/**
 * Returns list of coaches and their lobby count as a private message to the messaging user
 * @param {Discord.Message} message triggering message
 * @param {mysql.Pool} dbHandle bot database handle
 */
module.exports = async (message, dbHandle) => {
    var arguments = mH.getArguments(message);

    var getLobbyType = false;
    var finished = false;
    var dbResponse = [];
    while(arguments.length > 0 ) {
        let arg = arguments[0];
        arguments.shift();

        if(arg === "-type") {
            getLobbyType = true;
            continue;
        } 
        
        if(getLobbyType) {
            finished = true;
            if(arg === 'tryout')
                dbResponse = await t.getCoachList(dbHandle, 'lobbyCountTryout');
            else if (arg === 'normal')
                dbResponse = await t.getCoachList(dbHandle, 'lobbyCountNormal');
            else if (arg === 'replayAnalysis')
                dbResponse = await t.getCoachList(dbHandle, 'lobbyCountReplayAnalysis');
            else 
                dbResponse = await t.getCoachList(dbHandle, 'lobbyCount');
        }
    }

    if(!finished)
        dbResponse = await t.getCoachList(dbHandle, 'lobbyCount');
    
    var tableBase = [
        {
            name: 'Coach',
            value: '',
            inline: true,
        },
        {
            name: 'Total Coached Lobbies',
            value: '',
            inline: true,
        },
        {
            name: 'Regular Lobbies',
            value: '',
            inline: true,
        },
        {
            name: 'Tryouts',
            value: '',
        },
        {
            name: 'Replay Analyses',
            value: '',
        }
    ];    

    dbResponse.forEach(dbRow => {
        addDBRowToTable(tableBase, dbRow)
    });

    var _embed = aE.generateEmbedding(
        "Coached Lobby Highscores", 
        "Hall of Fame of DFZ coaches!", 
        "Start your lobbies with 🔒 to make them count!", 
        dbResponse.length > 0 ? tableBase : [])
    
    mH.reactPositive(message);
    message.author.send({embed: _embed});
}