const c = require("../misc/constants")
const locker = require("../misc/lock")
const rM = require("./roleManagement")

/**
 * Shuffles array in place.
 * thx @ https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

tier_sorter = function (a,b) {
    return b.tier.number - a.tier.number;
};

filterAndSortUsers_int =  function(users, filter, sorter) 
{
    var filteredUsers=users.filter(filter);
    return filteredUsers.sort(sorter);
},

filterAndSortByPositionAndTier_int = function(users, position)
{
    var _filter = (user) => {
        return user.positions.includes(position);
    };

    return filterAndSortUsers_int(users, _filter, tier_sorter);
},

filterByPosition = function(users, position)
{
    var _filter = (user) => {
        return user.positions.includes(position);
    };

    return users.filter(_filter);
},

getPlayersPerPosition = function(openUsers) {
    // get players per position
    var playersPerPosition = [];
    for(let position = 1; position < 6; position++)
    {
        playersPerPosition.push({pos: position, users: filterByPosition(openUsers, position)});
    }

    // sort to get 'tightest' positions (least amount of players) come first
    playersPerPosition.sort((a,b) => {
        return a.users.length - b.users.length;
    });

    return playersPerPosition;
}

createInhouseTeams = function(playerPositionMap, openUsers)
{
    // now sort by tier
    openUsers.sort(tier_sorter);

    var playersPerPosition = getPlayersPerPosition(openUsers);

    while (true)
    {
        // we're finished cause there are no more positions to fill
        if(playersPerPosition.length == 0)
            break;

        // take position with fewest available players
        var pos = playersPerPosition[0].pos;
        var players = playersPerPosition[0].users;

        // not enough players want to play this position, but we gotta make do
        if(players.length < 2)
        {
            if(openUsers.length < 2)
            {
                // that should not happen, number of players < 10 or something
                console.log("Did not have enough players to fill lobby, aborting");
                break;
            }

            if(players.length == 0)
            {
                // we have no players for any of the remaining positions => just fill from remaining player pool
                playerPositionMap[pos] = [openUsers[0], openUsers[1]];
            } else {
                // we have one player for this position => fill from remaining player pool, try to take same tier
                var other = openUsers.find(user => (user.id != players[0].id) && (user.tier.id == players[0].tier.id));
                
                // if we didnt find one from same tier, we take first player that is not this player
                if(other == undefined)
                    other = openUsers.find(user => (user.id != players[0].id));
                
                // assign and move on
                playerPositionMap[pos] = [players[0], other];
            }
        } else {
            // enough players want to play this position
            var found = false;
            var last = players[0];

            // add players to this position
            for( let i = 1; i < players.length; i++)
            {
                if (players[i].tier.id == last.tier.id)
                {
                    // second player of tier => assign position
                    playerPositionMap[pos] = [players[i], last];
                    found=true;
                    break;
                }

                last = players[i];
            }

            // we didnt find two same-tier-players, but we have enough players for the position, then just take the first two
            if(!found)
            {
                playerPositionMap[pos] = [players[0], players[1]];
            }
        }

        // cleanup for next iteration

        // position is finished, so get rid of it
        playersPerPosition.shift();

        // get ids
        var id1=playerPositionMap[pos][0].id;
        var id2=playerPositionMap[pos][1].id;

        // remove newly assigned players for the remaining positions
        playersPerPosition.forEach(players => {
            players.users = players.users.filter((usr)=>{
                if(usr.id == id1 || usr.id == id2)
                    return false;
                return true;
            });
        })

        // re-sort the positional player arrays
        playersPerPosition.sort((a,b) => {
            return a.users.length - b.users.length;
        });

        // remove newly assigned players from openUsers
        openUsers = openUsers.filter((usr)=>{
            if(usr.id == playerPositionMap[pos][0].id || usr.id == playerPositionMap[pos][1].id)
                return false;
            return true;
        });
    }
},

createnNonCompetitionTeams = function(playerPositionMap, openUsers) 
{
    var playersPerPosition = getPlayersPerPosition(openUsers);
    while (true)
    {
        // we're finished cause there are no more positions to fill
        if(playersPerPosition.length == 0)
            break;

        if(openUsers.length < 1)
        {
            console.log("Did not have enough players to fill lobby, aborting");
            break;
        }

        // we're finished cause there are no more positions to fill
        if(playersPerPosition.length == 0)
            break;

        // take position with fewest available players
        var pos = playersPerPosition[0].pos;
        var players = playersPerPosition[0].users;

        if(players.length >= 1)
            playerPositionMap[pos] = players[0];
        else 
            playerPositionMap[pos] = openUsers[0];

        // cleanup for next iteration

        // position is finished, so get rid of it
        playersPerPosition.shift();

        // get ids
        var id=playerPositionMap[pos].id;

        // remove newly assigned players for the remaining positions
        playersPerPosition.forEach(players => {
            players.users = players.users.filter((usr)=>{
                if(usr.id == id)
                    return false;
                return true;
            });
        })

        // re-sort the positional player arrays
        playersPerPosition.sort((a,b) => {
            return a.users.length - b.users.length;
        });

        // remove newly assigned players from openUsers
        openUsers = openUsers.filter((usr)=>{
            if(usr.id == playerPositionMap[pos].id)
                return false;
            return true;
        });
    }
},

module.exports = {
    addUser: function (message, lobby, name, id, positions, tier)
    {
        // create user
        var user = {};
        user.name = name;
        user.id = id;
        user.positions = Array.from(positions);
        user.positions.sort();
        user.tier = {};
        user.tier.id = tier.id;
        user.tier.number = rM.getNumberFromBeginnerRole(tier.id);
        user.tier.name = tier.name;

        // add to state
        locker.acquireWriteLock(function() {
            lobby.users.push(user);	
            message.reply("added you, for tonight's game for positions " + user.positions.join(", "))	
        }, function() {
            console.log("lock released in addUser");
        });
    },

    userExists: function (lobby, username) 
    {
        var found = false;
        locker.acquireReadLock(function() {
            found = lobby.users.find(element => element.name == username) != undefined;
        },() => {
            console.log("lock released in userExists");
            console.log("Found = " + found);
        });

        return found;
    },

    getUserIndex: function (lobby, username) 
    {
        var index = -1;
        locker.acquireReadLock(function() {
            index = lobby.users.findIndex(element => element.name == username);
        },() => {
            console.log("lock released in getUserIndex");
            console.log("index = " + index);
        });

        return index;
    },

    getUser: function (lobby, username) 
    {
        var _user = undefined;
        locker.acquireReadLock(function() {
            _user = lobby.users.find(element => element.name == username);
        },() => {
            console.log("lock released in getUser");
            console.log("index = " + _user);
        });

        return _user;
    },

    getUserByIndex: function (lobby, userIndex) 
    {
        var _user = undefined;
        locker.acquireReadLock(function() {
            _user = lobby.users.find(element => element.id == userIndex);
        },() => {
            console.log("lock released in getUser");
            console.log("index = " + _user);
        });

        return _user;
    },

    filterAndSortAllUsers: function(lobby, filter, sorter)
    {
        var filteredUsers=[];
        locker.acquireReadLock(function() {
            filteredUsers = filterAndSortUsers_int(lobby.users, filter, sorter);
        }, () => {
            console.log("lock released in filterAndSortAllUsers");
        });
        return filteredUsers;
    },

    filterAndSortUsers: filterAndSortUsers_int,

    filterAndSortByPositionAndTier: function(lobby, position) 
    {
        var filteredUsers=[];
        locker.acquireReadLock(function() {
            filteredUsers = filterAndSortByPositionAndTier_int(lobby.users, position);
        }, () => {
            console.log("lock released in filterAndSortByPositionAndTier");
        });
        return filteredUsers;
    },

    createTeams: function(users, lobbyType)
    {
        // result
        var playerPositionMap = {};

        // make copy
        var openUsers = users;

        // randomize users to not have e.g. first person to subscribe be pos 1 guaranteed etc.
        shuffle(openUsers);

        if(lobbyType == c.lobbyTypes.inhouse)
        {
            createInhouseTeams(playerPositionMap, openUsers);
        } else if (lobbyType == c.lobbyTypes.mmr)
        {
            createnNonCompetitionTeams(playerPositionMap, openUsers);
        }

        return playerPositionMap;
    },

    // debug output
    printUsers: function (lobby) 
    {
        console.log("All Users:");
        locker.acquireReadLock(function() {
            lobby.users.forEach(element => {
                console.log(element.name + ": " + element.positions.join(", ") + " @" + element.tier.name);
            });
        },() => {
            console.log("lock released in printUsers");
        });
    }
}