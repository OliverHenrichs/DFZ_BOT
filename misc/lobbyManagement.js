const locker = require("../misc/lock")
const eC = require("../misc/answerEmbedding")
const sT = require("string-table")

function isToday (someDate) {
    const today = new Date();
    var d1 = someDate;
    var d2 =  today.toISOString().substring(0, 9);
    return d1 == d2;
}

function getCurrentUsersAsTable(state) {

    if(state.lobby.users.length == 0) {
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
        }];

    // fill fields
    locker.acquireReadLock(function() {
        state.lobby.users.forEach(element => {
            tableBase[0].value = tableBase[0].value + "\r\n" +element.name;
            tableBase[1].value = tableBase[1].value + "\r\n" +element.positions.join(", ");
            tableBase[2].value = tableBase[2].value + "\r\n" +element.tier.name;
        });
        }, () => {
            console.log("lock released in getCurrentUsersAsTable");
    });

    return tableBase;
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

    createLobbyPost: function(state, client) {    
        var userSets = [];
        var userSet = [];
        for (let i = 0; i < state.lobby.users.length; i++) {
            if(i%10 == 0 && i !=0)
            {
                userSets.push(userSet);
                userSet = [];
            }
                
            userSet.push(state.lobby.users[i]);
        }

        const _embed = eC.generateEmbedding("Lobby is up", "Name: 'DotaFromZero1'\r\n PW :'dfz'", "", 'success', getCurrentUsersAsTable(state));
        const channel = client.channels.get(process.env.LOBBY_SIGNUP_CHANNEL_ID);
        channel.send({embed: _embed});
    }
}