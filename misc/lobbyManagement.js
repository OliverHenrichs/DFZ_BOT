const c = require("../misc/constants")
const cM = require("../misc/channelManagement")
const g = require("../misc/generics")
const aE = require("../misc/answerEmbedding")
const uH = require("../misc/userHelper")
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

function addUserWithPositionsToUserTable(tableBase, user, positions, startIndex = 0, mention=false)
{
    tableBase[startIndex].value = tableBase[startIndex].value + "\r\n" + (mention ? ("["+user.region.name +"]<@" +user.id + ">") : "["+user.region.name +"]"+user.name);
    tableBase[startIndex+1].value = tableBase[startIndex+1].value + "\r\n" + positions.join(", ");
    tableBase[startIndex+2].value = tableBase[startIndex+2].value + "\r\n" + user.tier.name;
}

/**
 *  adds user + position + tier to table
 *  @param tableBase table to which data is added
 *  @param user user to add
 *  @param mention if true mentions the user in the table
 */
function addToUserTable(tableBase, user, startIndex = 0, mention=false) {
    addUserWithPositionsToUserTable(tableBase, user, user.positions, startIndex, mention);
}

/**
 *  returns a table of users
 *  @param tableBase table to which data is added
 *  @param users array of users
 *  @param playersPerLobby how many players fit in the lobby? rest is bench; value of -1 will allow any number
 *  @param mention if true mentions the users in the table
 */
function getUserTable(users, playersPerLobby=-1, mention=false) {
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

    var tableBench = [
        {
            name: 'Bench',
            value: 'If people leave, you get pushed up'
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
    ]

    var startIndexPlayers = 0;
    var startIndexBench = 1;

    var usrIndex = 0;
    users.forEach(usr => {

        if(usrIndex++ < playersPerLobby || playersPerLobby === -1)
            addToUserTable(tableBase, usr, startIndexPlayers, mention);
        else
            addToUserTable(tableBench, usr, startIndexBench, mention);
    });

    if(usrIndex > playersPerLobby && playersPerLobby !== -1)
    {
        var finalTable = tableBase.concat(tableBench);
        return finalTable;
    }
        
    
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

    var key = Object.keys(c.lobbyTypes).find(typeKey => c.lobbyTypes[typeKey] == lobby.type);
    var playersPerLobby = c.lobbyTypePlayerCount[key];
    
    userTable = getUserTable(lobby.users, playersPerLobby, mention);

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
    addUserWithPositionsToUserTable(tableBase, player, [position], index, mention)
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
    } else if (lobbyType == c.lobbyTypes.unranked || lobbyType == c.lobbyTypes.botbash || lobbyType == c.lobbyTypes.tryout)
    {        
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
    
        Object.keys(assignedUsers).forEach((position) => {
            var player = assignedUsers[position];
            addUserToTeam(tableBase, 0, player, position, mention);
        });

        return tableBase;
    }

    return [];
}

/**
 * Updates message embedding to fit new title / pin status
 * @param {string} messageId message ID of the message that we want to change
 * @param {*} channel the message's channel
 * @param {string} titleUpdate new title
 * @param {boolean} unpin true to unpin message
 */
async function updateAndUnpinLobbyEmbedding(messageId, channel, titleUpdate, unpin=true) 
{
    // fetch message
    const message = await channel.fetchMessage(messageId);
    if(unpin === true)
        message.unpin();

    // generate new embed
    old_embed = message.embeds[0];
    var new_embed =   new Discord.RichEmbed(old_embed)
                            .setTitle(titleUpdate +"\n~~" + old_embed.title + "~~");
    //new_embed.fields = undefined;
    
    // update embed
    message.edit(new_embed);
}

// lobby management
module.exports = {
    
    /**
     *  Searches state in channel for lobby by checking for the right message ID
     *  @return undefined if not found, else returns the lobby
     *  @param state bot state
     *  @param channelId message channel id
     *  @param messageId message ID
     */
    findLobbyByMessage: function(state, channelId, messageId)
    {
        var lobby = undefined;

        // check all lobby types in channel, for each found check if its message id fits;
        for (var key in c.lobbyTypes){
            lobby = state.lobbies[channelId][c.lobbyTypes[key]];
            if(lobby === undefined)
                continue;
            if(lobby.messageId === messageId)
                break;
            lobby = undefined;
        }

        return lobby;
    },

    /**
     *  Checks if lobby exists and is of today, returns lobby if and undefined if not
     *  @return undefined if above condition is not fulfilled, else returns the lobby
     *  @param state bot state
     *  @param channel message channel
     *  @param type lobby type
     */
    getLobby: function (state, channel, type) 
    {
        if(state.lobbies[channel] !== undefined)
            return state.lobbies[channel][type];
            
        return undefined;
    },

    /**
     *  Create lobby in given channel and of given type at given time
     *  @return undefined if above condition is not fulfilled
     *  @param state bot state
     *  @param channel message channel
     *  @param type lobby type
     *  @param beginnerRoles allowed Beginner roles
     *  @param regionRole allowed Beginner roles
     *  @param date date of lobby
     *  @param messageID ref to lobby-message to alter it
     */
    createLobby: function (state, channel, type, beginnerRoles, regionRole, date, messageID) 
    {
        // override / create lobby
        state.lobbies[channel][type] = {
            type: type,
            date: date,
            users: [],
            beginnerRoleIds: beginnerRoles, // roles
            regionId: regionRole,
            messageId : messageID
          };
    },

    /**
     * Removes lobby in backend
     * @param {*} state bot state
     * @param {*} channel lobby channel
     * @param {*} type lobby type
     */
    removeLobby: function(state, channel, type)
    {
        state.lobbies[channel][type] = undefined;
    },

    /**
     *  Update lobby post to account for current lobby state
     *  @param lobby bot state
     *  @param channel message channel
     */
    updateLobbyPost: async function(lobby, channel)
    {
        // fetch message
        const message = await channel.fetchMessage(lobby.messageId);
        old_embed = message.embeds[0];

        // generate new embed
        var new_embed = new Discord.RichEmbed(old_embed);
        new_embed.fields = getCurrentUsersAsTable(lobby, true);
        
        // update embed
        await message.edit(new_embed);
    },

    /**
     *  Update lobby time of each lobby post and delete deprecated lobbies
     *  @param lobbies available lobbies
     *  @param channels the bot's message channels on the server
     */
    updateLobbyTimes: async function(channels, lobbies)
    {
        g.asyncForEach(cM.botChannels, async channelId => {
            // get channel
            var channel = channels.find(chan => { return chan.id == channelId});
            if(!channel)
                return;
    
            // go through lobby types
            await g.asyncForEach(Object.keys(c.lobbyTypes), async key =>  {
                // get lobby
                var lobby = lobbies[channelId][c.lobbyTypes[key]];
                if(lobby === undefined)
                    return;
    
                // update lobby time
                
                // fetch message
                const message = await channel.fetchMessage(lobby.messageId);
                old_embed = message.embeds[0];

                // remove old time 
                var startString = "Time to lobby: ";
                var description = old_embed.description.split('\n');
                if(description[description.length - 1].startsWith(startString)) 
                    description.pop();

                // get new time
                var remainingMs = lobby.date - Date.now();
                if(remainingMs > 0 )
                {
                    var minutes = Math.floor((remainingMs / (1000 * 60)) % 60);
                    var hours = Math.floor((remainingMs / (1000 * 60 * 60)));
                    description.push(startString + (hours > 0  ? hours + "h " : "") + minutes + "min");
                } else {
                    var minutes = Math.floor((-remainingMs / (1000 * 60)) % 60);
                    var hours = Math.floor((-remainingMs / (1000 * 60 * 60)));

                    // more than 3 hours ago => delete lobby
                    if(hours >= 3)
                    {
                        await updateAndUnpinLobbyEmbedding(lobby.messageId, channel, "[⛔ Removed deprecated lobby 😾]");
                        lobbies[channelId][c.lobbyTypes[key]] = undefined;
                        return;
                    } else {
                        startString = "Lobby started ";
                        if(description[description.length - 1].startsWith(startString)) 
                            description.pop();
                        description.push(startString + (hours > 0  ? hours + "h " : "") + minutes + "min ago");
                    }
                }

                // generate new embed
                var new_embed =   new Discord.RichEmbed(old_embed);
                new_embed.description = description.join('\n');
                
                // update embed
                await message.edit(new_embed);
            });
        });
    },

    /**
     * Indicate that lobby has started
     * @param {*} lobby lobby
     * @param {*} channel message channel
     */
    finishLobbyPost: async function(lobby, channel)
    {
        updateAndUnpinLobbyEmbedding(lobby.messageId, channel, "[⛔ Lobby started already! 😎]")
    },
    
    /**
     *  Update lobby post to account for cancellation of lobby
     *  @param lobby lobby
     *  @param channel message channel
     */
    cancelLobbyPost: async function(lobby, channel)
    {
        updateAndUnpinLobbyEmbedding(lobby.messageId, channel, "[⛔ Lobby cancelled! 😢]")
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
    createLobbyStartPost: function(state, channel, type, playersPerLobby) 
    {    
        var userSets = [];
        var userSet = [];

        var lobby = state.lobbies[channel.id][type]
        for (let i = 0; i < lobby.users.length; i++) { // add in batches of lobbyTypePlayerCount
            userSet.push(lobby.users[i]);
            
            if((i+1)%(playersPerLobby) == 0)
            {
                userSets.push(userSet);
                userSet = [];
            }
        }

        if(userSets.length == 0)
        {
            if (userSet.length != 0) // Not enough players but forced
            {
                const _embed = aE.generateEmbedding("Not enough players for a lobby but we gotta get going anyway", "", "", getUserTable(userSet, playersPerLobby, true));
                channel.send({embed: _embed});
                return;
            }
        }

        var counter = 0;
        userSets.forEach(us => {
            var teams = uH.createTeams(us,type);
            var teamTable = getTeamTable(teams, type, true);
            
            const _embed = aE.generateEmbedding(c.getLobbyNameByType(type) + " lobby #" + (++counter) + (counter == 1 ? " starts now " : " starts later "), "", "", teamTable);
            channel.send({embed: _embed});
        });

        if (userSet.length != 0) // bench
        {
            const _embed = aE.generateEmbedding("Today's bench", "", "", getUserTable(userSet, -1, true));
            channel.send({embed: _embed});
        }
    }
}