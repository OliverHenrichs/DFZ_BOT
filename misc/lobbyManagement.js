const locker = require("../misc/lock")
const eC = require("../misc/answerEmbedding")
const sT = require("string-table")
const uH = require("../misc/userHelper")

function isToday (someDate) {
    const today = new Date();
    var d1 = someDate;
    var d2 =  today.toISOString().substring(0, 10);
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

function getCurrentUsersAsTable(lobby, mention=false) {
    var userTable = [];
    
    locker.acquireReadLock(function() {
            userTable = getUserTable(lobby.users, mention);
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
    lobbyTypes: {inhouse:1,mmr:2},

    hasLobby: function (state, channel, type) 
    {
        var lobbyExists = false;
        locker.acquireReadLock(function() {
            var lobby = state.lobbies[channel][type];
            if(lobby != undefined && isToday(lobby.date)){
                lobbyExists = true;
            }
	    }, () => {
            console.log("lock released in hasLobby");
        });
        return lobbyExists;
    },

    createLobby: function (state, channel, type, numbers, time) 
    {
        locker.acquireWriteLock(function() {
            // override / create lobby
            state.lobbies[channel][type] = {
                date: new Date().toISOString().substring(0, 10),
                time: time,
                users: [],
                tiers: numbers, // roles
                locked: false
              };
        }, function() {
            console.log("lock released in createLobby");
        });
    },

    getCurrentUsersAsTable: getCurrentUsersAsTable,

    getCurrentUsersWithPositionAsTable: function (lobby, position) 
    {
        var users = uH.filterAndSortByPositionAndTier(lobby, position);
        return getPositionalUserTable(users, position);
    },

    createLobbyPost: function(state, client, channel, type) 
    {    
        var userSets = [];
        var userSet = [];
        

        locker.acquireReadLock(function() {
            var lobby = state.lobbies[channel][type]
            for (let i = 0; i < lobby.users.length; i++) { // add in batches of 10
                userSet.push(lobby.users[i]);
                
                if(i%9 == 0 && i != 0)
                {
                    userSets.push(userSet);
                    userSet = [];
                }
            }
        }, () => {
            console.log("lock released in createLobbyPost");
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