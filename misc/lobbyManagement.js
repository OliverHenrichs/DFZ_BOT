const locker = require("../misc/lock")
const eC = require("../misc/answerEmbedding")
const sT = require("string-table")
const uH = require("../misc/userHelper")

function isToday (someDate) {
    const today = new Date();
    var d1 = someDate;
    var d2 =  today.toISOString().substring(0, 9);
    return d1 == d2;
}

function getPositionalUserTable(users, position, mention=false) {
    if(users.length == 0) {
        return undefined;
    }

    // setup fields for embedding
    var tableBase = [
        {
            name: 'Name',
            value: '',
            inline: true,
        },
        {
            name: 'Tier',
            value: '',
            inline: true,
        }
    ];

    // fill fields
    locker.acquireReadLock(function() {
        users.forEach(usr => {
            tableBase[0].value = tableBase[0].value + "\r\n" + (mention ? ("<@" +usr.id + ">") : usr.name);
            tableBase[1].value = tableBase[1].value + "\r\n" +usr.tier.name;
        });
        }, () => {
            console.log("lock released in getCurrentUsersAsTable");
    });

    // get header
    var tableHead = 
    {
        name: 'Position',
        value: position
    };
    tableBase.unshift(tableHead);

    return tableBase;
}

function addToUserTable(tableBase, user, mention=false) {
    {
        tableBase[0].value = tableBase[0].value + "\r\n" + (mention ? ("<@" +user.id + ">") : user.name);
        tableBase[1].value = tableBase[1].value + "\r\n" +user.positions.join(", ");
        tableBase[2].value = tableBase[2].value + "\r\n" +user.tier.name;
    }
}

function getUserTable(users, mention=false) {
    if(users.length == 0) {
        return undefined;
    }

    // setup fields for embedding
    var tableBase = [
        {
            name: 'Name',
            value: '',
            inline: true,
        },
        {
            name: 'Position',
            value: '',
            inline: true,
        },
        {
            name: 'Tier',
            value: '',
            inline: true,
        }
    ];


    users.forEach(usr => {
        addToUserTable(tableBase, usr, mention);
    });

    //tableBase.unshift(tableHead);

    return tableBase;
}

function getCurrentUsersAsTable(state, mention=false) {
    var userTable = [];
    
    locker.acquireReadLock(function() {
        userTable = getUserTable(state.lobby.users, mention);
    }, () => {
        console.log("lock released in getCurrentUsersAsTable");
    });

    return userTable;
}

function getTeamTable(assignedUsers, mention=false) {
    
    var tableBase = [
        {
            name: 'Side',
            value: 'Radiant'
        },
        {
            name: 'Name',
            value: '',
            inline: true,
        },
        {
            name: 'Position',
            value: '',
            inline: true,
        },
        {
            name: 'Tier',
            value: '',
            inline: true,
        },
        {
            name: 'Side',
            value: 'Dire'
        },
        {
            name: 'Name',
            value: '',
            inline: true,
        },
        {
            name: 'Position',
            value: '',
            inline: true,
        },
        {
            name: 'Tier',
            value: '',
            inline: true,
        }
    ];

    
    Object.keys(assignedUsers).forEach((position) => {
        var players = assignedUsers[position];
        var radiantPlayer = players[0];
        tableBase[1].value = tableBase[1].value + "\r\n" + (mention ? ("<@" +radiantPlayer.id + ">") : radiantPlayer.name);
        tableBase[2].value = tableBase[2].value + "\r\n" + position;
        tableBase[3].value = tableBase[3].value + "\r\n" +radiantPlayer.tier.name;
        
        var direPlayer = players[1];
        tableBase[5].value = tableBase[5].value + "\r\n" + (mention ? ("<@" +direPlayer.id + ">") : direPlayer.name);
        tableBase[6].value = tableBase[6].value + "\r\n" + position;
        tableBase[7].value = tableBase[7].value + "\r\n" +direPlayer.tier.name;
    });

    return tableBase;
}

// lobby management
module.exports = {
    hasLobby: function (state) 
    {
        var lobbyExists = false;
        locker.acquireReadLock(function() {
            if(state.lobby != undefined && isToday(state.lobby.date)){
                lobbyExists = true;
            }
	    });
        return lobbyExists;
    },

    createLobby: function (state, numbers) 
    {
        locker.acquireWriteLock(function() {
            // override / create lobby
            state.lobby = {
                date: new Date().toISOString().substring(0, 9),
                users: [],
                tiers: numbers, // roles
                locked: false
              };
        });
    },

    getCurrentUsersAsTable: getCurrentUsersAsTable,

    getCurrentUsersWithPositionAsTable: function (state, position) 
    {
        var users = uH.filterAndSortByPositionAndTier(state, position);
        return getPositionalUserTable(users, position);
    },

    createLobbyPost: function(state, client) 
    {    
        var userSets = [];
        var userSet = [];
        
        locker.acquireReadLock(function() {
            for (let i = 0; i < state.lobby.users.length; i++) { // add in batches of 10
                userSet.push(state.lobby.users[i]);
                
                if(i%9 == 0 && i != 0)
                {
                    userSets.push(userSet);
                    userSet = [];
                }
            }
        });

        userSets.forEach(us => {

            var teams = uH.createTeams(us);
            
            const _embed = eC.generateEmbedding("Lobby is up", "Name: 'Ask your'\r\n PW :'Coach'", "", 'success', getTeamTable(teams, true));
            const channel = client.channels.get(process.env.LOBBY_SIGNUP_CHANNEL_ID);
            channel.send({embed: _embed});

        });

        if (userSet.length != 0) // bench
        {
            const _embed = eC.generateEmbedding("Bench is today full of high potentials", "", "", 'success', getUserTable(userSet, true));
            const channel = client.channels.get(process.env.LOBBY_SIGNUP_CHANNEL_ID);
            channel.send({embed: _embed});
        }
    }
}