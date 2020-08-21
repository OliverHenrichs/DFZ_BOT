const c = require("../misc/constants")
const locker = require("../misc/lock")
const eC = require("../misc/answerEmbedding")
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

function addUserToTeam(tableBase, index, player, position, mention)
{
    tableBase[index].value = tableBase[index].value + "\r\n" + (mention ? ("<@" +player.id + ">") : player.name);
    tableBase[index+1].value = tableBase[index+1].value + "\r\n" + position;
    tableBase[index+2].value = tableBase[index+2].value + "\r\n" +player.tier.name;
}

function getTeamTable(assignedUsers, lobbyType, mention=false) {
    if(lobbyType == c.lobbyTypes.inhouse)
    {
        var tableBaseInhouse = [
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
            addUserToTeam(tableBaseInhouse, 1, players[0], position, mention);
            addUserToTeam(tableBaseInhouse, 5, players[1], position, mention);
        });

        return tableBaseInhouse;
    } else if (lobbyType == c.lobbyTypes.mmr)
    {        
        var tableBaseMMR = [
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
        var player = assignedUsers[position];
        addUserToTeam(tableBaseMMR, 0, player, position, mention);
    });

    return tableBaseMMR;
        
    }

    return [];
}

// lobby management
module.exports = {
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

    createLobbyPost: function(state, channel, type, playersPerLobby) 
    {    
        var userSets = [];
        var userSet = [];

        locker.acquireReadLock(function() {
            var lobby = state.lobbies[channel.id][type]
            for (let i = 0; i < lobby.users.length; i++) { // add in batches of lobbyTypePlayerCount
                userSet.push(lobby.users[i]);
                
                if((i+1)%(playersPerLobby) == 0)
                {
                    userSets.push(userSet);
                    userSet = [];
                }
            }
        }, () => {
            console.log("lock released in createLobbyPost");
        });

        if(userSets.length == 0)
        {
            if (userSet.length != 0) // Not enough players but forced
            {
                const _embed = eC.generateEmbedding("Not enough players for a lobby but we gotta get going anyway", "", "", 'success', getUserTable(userSet, true));
                channel.send({embed: _embed});
                return;
            }
        }

        userSets.forEach(us => {
            var teams = uH.createTeams(us,type);
            var teamTable = getTeamTable(teams, type, true);
            
            const _embed = eC.generateEmbedding(c.getLobbyNameByType(type) + " lobby can start now with the following players", "", "", 'success', teamTable);
            channel.send({embed: _embed});
        });

        if (userSet.length != 0) // bench
        {
            const _embed = eC.generateEmbedding("Today's bench", "", "", 'success', getUserTable(userSet, true));
            channel.send({embed: _embed});
        }
    }
}