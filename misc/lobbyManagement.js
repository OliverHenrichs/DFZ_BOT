const locker = require("../misc/lock")
const eC = require("../misc/answerEmbedding")
const sT = require("string-table")

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

function getUserTable(users, mention=false) {
    if(users.length == 0) {
        return undefined;
    }

    // var tableHead = 
    // {
    //     name: 'Side',
    //     value: 'Radiant'
    // };

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
        tableBase[0].value = tableBase[0].value + "\r\n" + (mention ? ("<@" +usr.id + ">") : usr.name);
        tableBase[1].value = tableBase[1].value + "\r\n" +usr.positions.join(", ");
        tableBase[2].value = tableBase[2].value + "\r\n" +usr.tier.name;
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

// lobby management
module.exports = {
    hasLobby: function (state) {
        var lobbyExists = false;
        locker.acquireReadLock(function() {
            if(state.lobby != undefined && isToday(state.lobby.date)){
                lobbyExists = true;
            }
	    });
        return lobbyExists;
    },

    createLobby: function (state, numbers) {
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

    getCurrentUsersWithPositionAsTable: function (state, position) {
        var userTable ={}
        var filteredUsers=[];
        var filteredSortedUsers=[];
        locker.acquireReadLock(function() {
            filteredUsers = state.lobby.users.filter(user => user.positions.includes(position));
            filteredSortedUsers = filteredUsers.sort((a,b) => b.tier.number - a.tier.number)
        });
        
        userTable = getPositionalUserTable(filteredSortedUsers, position);

        return userTable;
    },

    createLobbyPost: function(state, client) {    
        var userSets = [];
        var userSet = [];
        
        locker.acquireReadLock(function() {
            for (let i = 0; i < state.lobby.users.length; i++) { // add in batches of 10
                if(i%10 == 0 && i != 0)
                {
                    userSets.push(userSet);
                    userSet = [];
                }
                    
                userSet.push(state.lobby.users[i]);
            }
        });

        if (userSet.length != 0) // incomplete user set
            userSets.push(userSet);

        userSets.forEach(userSet => {
            userSet.sort((a, b) => {
                return b.tier.number - a.tier.number
            });

            // TODO matchmaking
            
            const _embed = eC.generateEmbedding("Lobby is up", "Name: 'Ask your'\r\n PW :'Coach'", "", 'success', getUserTable(userSet, true));
            const channel = client.channels.get(process.env.LOBBY_SIGNUP_CHANNEL_ID);
            channel.send({embed: _embed});

        });
    }
}