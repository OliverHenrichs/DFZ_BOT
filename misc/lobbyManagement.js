const c = require("../misc/constants")
const locker = require("../misc/lock")
const eC = require("../misc/answerEmbedding")
const uH = require("../misc/userHelper")
const tZ = require("../misc/timeZone")
const Discord = require("discord.js")

/**
 *  returns user table for a specific position
 *  @return array of table entries
 *  @param users array of users
 *  @param position position of users
 *  @param mention if true mentions the users in the table
 */
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
    users.forEach(usr => {
        tableBase[0].value = tableBase[0].value + "\r\n" + (mention ? ("<@" +usr.id + ">") : usr.name);
        tableBase[1].value = tableBase[1].value + "\r\n" +usr.tier.name;
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

/**
 *  adds user + position + tier to table
 *  @param tableBase table to which data is added
 *  @param user user to add
 *  @param mention if true mentions the user in the table
 */
function addToUserTable(tableBase, user, mention=false) {
    {
        tableBase[0].value = tableBase[0].value + "\r\n" + (mention ? ("<@" +user.id + ">") : user.name);
        tableBase[1].value = tableBase[1].value + "\r\n" +user.positions.join(", ");
        tableBase[2].value = tableBase[2].value + "\r\n" +user.tier.name;
    }
}

/**
 *  returns a table of users
 *  @param tableBase table to which data is added
 *  @param users array of users
 *  @param mention if true mentions the users in the table
 */
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

/**
 *  adds user + position + tier to table
 *  @param tableBase table to which data is added
 *  @param users user to add
 *  @param mention if true mentions the user in the table
 */
function getCurrentUsersAsTable(lobby, mention=false) {
    var userTable;
    
    locker.acquireReadLock(function() {
            userTable = getUserTable(lobby.users, mention);
    }, () => {
        console.log("lock released in getCurrentUsersAsTable");
    });

    return userTable;
}

/**
 *  adds user + position + tier to team table
 *  @param tableBase table to which data is added
 *  @param index table index at which data is added
 *  @param player user to add
 *  @param position position of user to add
 *  @param mention if true mentions the user in the table
 */
function addUserToTeam(tableBase, index, player, position, mention)
{
    tableBase[index].value = tableBase[index].value + "\r\n" + (mention ? ("<@" +player.id + ">") : player.name);
    tableBase[index+1].value = tableBase[index+1].value + "\r\n" + position;
    tableBase[index+2].value = tableBase[index+2].value + "\r\n" +player.tier.name;
}

/**
 *  Creates a table for a match given assigned users
 *  @param assignedUsers field where for each position players are assigned
 *  @param lobbyType type of lobby to determine table shape
 *  @param mention if true mentions the users in the table
 */
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
    } else if (lobbyType == c.lobbyTypes.unranked || lobbyType == c.lobbyTypes.botbash)
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

    /**
     *  Checks if lobby exists and is of today, returns lobby if and undefined if not
     *  @return undefined if above condition is not fulfilled, else returns the lobby
     *  @param state bot state
     *  @param channel message channel
     *  @param type lobby type
     */
    getLobby: function (state, channel, type) 
    {
        var lobby =  {};
        locker.acquireReadLock(function() {
            lobby = state.lobbies[channel][type];
            if(lobby == undefined)
            {
                return;
            }
	    }, () => {
            console.log("lock released in hasLobby");
        });
        return lobby;
    },

    /**
     *  Create lobby in given channel and of given type at given time
     *  @return undefined if above condition is not fulfilled
     *  @param state bot state
     *  @param channel message channel
     *  @param type lobby type
     *  @param roles allowed Beginner roles
     *  @param date date of lobby
     *  @param messageID ref to lobby-message to alter it
     */
    createLobby: function (state, channel, type, roles, date, messageID) 
    {
        locker.acquireWriteLock(function() {
            // override / create lobby
            state.lobbies[channel][type] = {
                date: date,
                users: [],
                tiers: roles, // roles
                messageId : messageID
              };
        }, function() {
            console.log("lock released in createLobby");
        });
    },

    removeLobby: function(state, channel, type)
    {
        locker.acquireWriteLock(function() {
            // override / create lobby
            state.lobbies[channel][type] = undefined;
        }, function() {
            console.log("lock released in removeLobby");
        });
    },

    /**
     *  Update lobby post to account for current lobby state
     *  @param lobby bot state
     *  @param channel message channel
     */
    updateLobbyPost: async function(lobby, channel)
    {
        locker.acquireWriteLockLobbyPost(async function() {
            // fetch message
            const message = await channel.fetchMessage(lobby.messageId);
            old_embed = message.embeds[0];
    
            // generate new embed
            var new_embed =   new Discord.RichEmbed(old_embed);
            new_embed.fields = getCurrentUsersAsTable(lobby, true);
            
            // update embed
            await message.edit(new_embed);
        });
    },

    /**
     *  Update lobby post to account for cancellation of lobby
     *  @param lobby bot state
     *  @param channel message channel
     */
    cancelLobbyPost: async function(lobby, channel)
    {
        // fetch message
        const message = await channel.fetchMessage(lobby.messageId);
        old_embed = message.embeds[0];

        // generate new embed
        var new_embed =   new Discord.RichEmbed(old_embed)
                             .setTitle("[⛔ Lobby cancelled! 😢]\n~~" + old_embed.title + "~~");
        new_embed.fields = undefined;
        
        // update embed
        message.edit(new_embed);
    },

    getCurrentUsersAsTable: getCurrentUsersAsTable,

    /**
     *  Creates a table containing a list of players wanting to play given position in given lobby yet
     *  @param lobby lobby to be checked
     *  @param position position to be checked
     *  @return table containing all players that fit the criterion
     */
    getCurrentUsersWithPositionAsTable: function (lobby, position) 
    {
        var users = uH.filterAndSortByPositionAndTier(lobby, position);
        return getPositionalUserTable(users, position);
    },

    /**
     *  Creates an embedding for a starting lobby
     *  @param state state of bot
     *  @param channel channel in which lobby resides
     *  @param type type of lobby
     *  @param playersPerLobby how many players per lobby (will create multiple lobbies if e.g. more than 2x the neccessary players showed up. Rest go to bench).
     */
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
                const _embed = eC.generateEmbedding("Not enough players for a lobby but we gotta get going anyway", "", "", getUserTable(userSet, true));
                channel.send({embed: _embed});
                return;
            }
        }

        var counter = 0;
        userSets.forEach(us => {
            var teams = uH.createTeams(us,type);
            var teamTable = getTeamTable(teams, type, true);
            
            const _embed = eC.generateEmbedding(c.getLobbyNameByType(type) + " lobby #" + (++counter) + (counter == 1 ? " starts now " : " starts later "), "", "", teamTable);
            channel.send({embed: _embed});
        });

        if (userSet.length != 0) // bench
        {
            const _embed = eC.generateEmbedding("Today's bench", "", "", getUserTable(userSet, true));
            channel.send({embed: _embed});
        }
    }
}