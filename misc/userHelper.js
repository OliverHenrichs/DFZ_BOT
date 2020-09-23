const c = require("../misc/constants")
const g = require("../misc/generics")
const rM = require("./roleManagement")

/**
 * Swap two array elements in place
 * thx @ https://stackoverflow.com/questions/872310/javascript-swap-array-elements
 * @param x first item index
 * @param y second item index
 * @return ref to array
 */
Array.prototype.swap = function (x,y) {
    var b = this[x];
    this[x] = this[y];
    this[y] = b;
    return this;
}

/**
 * compares two users by tier
 * @param {*} a user a
 * @param {*} b user b
 */
function tier_sorter(a,b) {
    return b.tier.number - a.tier.number;
};

/**
* compares two users by tier the other way round
* @param {*} a user a
* @param {*} b user b
*/
function reverse_tier_sorter(a,b) {
   return a.tier.number - b.tier.number;
};

/**
 * Filters and sorts users 
 * @param {*} users 
 * @param {*} filter 
 * @param {*} sorter 
 * @return filtered and sorted array of users
 */
function filterAndSortUsers_int(users, filter, sorter) 
{
    var filteredUsers=users.filter(filter);
    return filteredUsers.sort(sorter);
};

/**
 * Filters users by position and sorts the filtered users by tier
 * @param {*} users 
 * @param {*} position 
 * @return filtered array of users
 */
function filterAndSortByPositionAndTier_int(users, position)
{
    var _filter = (user) => {
        return user.positions.includes(position);
    };

    return filterAndSortUsers_int(users, _filter, tier_sorter);
};

/**
 * Filters users by position
 * @param {*} users 
 * @param {*} position 
 * @return filtered array of users
 */
function filterByPosition(users, position)
{
    var _filter = (user) => {
        return user.positions.includes(position);
    };

    return users.filter(_filter);
}

/**
 * Returns an array of positions with all players having that position in each of the arrays
 * @param {*} _users given users
 * @return array of positions; each entry has position and the respective users that want to play it
 */
function getPlayersPerPosition(_users) {
    // get players per position
    var playersPerPosition = [];
    for(let position = 1; position < 6; position++)
    {
        playersPerPosition.push({pos: position, users: filterByPosition(_users, position)});
        
        // randomly reverse order
        if(g.coinflip()=== true)
            playersPerPosition[position-1].users.reverse();
    }

    // sort to get 'tightest' positions (least amount of players) come first
    playersPerPosition.sort((a,b) => {
        return a.users.length - b.users.length;
    });

    return playersPerPosition;
}

/**
 * Matchmaking system for beginner tiers
 * @param {map} playerPositionMap maps players to position
 * @param {list} openUsers users in the lobby
 */
createInhouseTeams = function(playerPositionMap, openUsers)
{
    // now sort by tier
    openUsers.sort(g.coinflip() === true ? tier_sorter : reverse_tier_sorter);

    var playersPerPosition = getPlayersPerPosition(openUsers);
    var skillPoints = {radiant:0, dire:0};
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

        // take care of balancing in case of unequal teams
        
        // current skill diff in teams
        var skillDiffTeams = skillPoints.radiant - skillPoints.dire;
        
        // skill diff for new players
        var skillRadiantPlayer = playerPositionMap[pos][0].tier.number;
        var skillDirePlayer = playerPositionMap[pos][1].tier.number;
        var skillDiffNewUsers = skillRadiantPlayer-skillDirePlayer;

        if(skillDiffTeams > 0 ) // radiant advantage => put stronger player on dire
        {
            if(skillDiffNewUsers > 0) // radiant player is stronger => swap
                playerPositionMap[pos].swap(0,1);
        } else { // dire advantage or equal => put stronger player on radiant
            if(skillDiffNewUsers < 0) // dire player is stronger => swap
                playerPositionMap[pos].swap(0,1);
        }

        skillPoints.radiant += playerPositionMap[pos][0].tier.number;
        skillPoints.dire += playerPositionMap[pos][1].tier.number;

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
    addUser: function (lobby, name, id, positions, tier)
    {
        // create user
        var user = {};
        user.name = name;
        user.id = id;
        user.positions = positions;
        user.positions.sort();
        user.tier = {};
        user.tier.id = tier.id;
        user.tier.number = rM.getNumberFromBeginnerRole(tier.id);
        user.tier.name = tier.name;

        // add to lobby
        lobby.users.push(user);	
    },

    userExists: function (lobby, userId) 
    {
        return lobby.users.find(element => element.id == userId) !== undefined;
    },

    getUserIndex: function (lobby, userId) 
    {
        return lobby.users.findIndex(user => user.id == userId);
    },

    getUser: function (lobby, userId) 
    {
        return lobby.users.find(element => element.id == userId);
    },

    filterAndSortAllUsers: function(lobby, filter, sorter)
    {
        return filterAndSortUsers_int(lobby.users, filter, sorter);
    },

    filterAndSortUsers: filterAndSortUsers_int,

    filterAndSortByPositionAndTier: function(lobby, position) 
    {
        return filterAndSortByPositionAndTier_int(lobby.users, position);
    },

    /**
     * Creates teams based on users and lobby type
     * @param {list} users 
     * @param {int} lobbyType
     */
    createTeams: function(users, lobbyType)
    {
        var playerPositionMap = {};
        var openUsers = users;

        // randomize users to not have e.g. first person to subscribe be pos 1 guaranteed etc.
        g.shuffle(openUsers);

        if(lobbyType == c.lobbyTypes.inhouse)
        {
            createInhouseTeams(playerPositionMap, openUsers);
        } else if (lobbyType == c.lobbyTypes.unranked || lobbyType == c.lobbyTypes.botbash || lobbyType == c.lobbyTypes.tryout)
        {
            createnNonCompetitionTeams(playerPositionMap, openUsers);
        }

        return playerPositionMap;
    }
}