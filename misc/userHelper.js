const locker = require("../misc/lock")
const rM = require("./roleManagement")

module.exports = {
    addUser: function (message, state, name, id, positions, tier) {
        // create user
        var user = {};
        user.name = name;
        user.id = id;
        user.positions = Array.from(positions);
        user.positions.sort();
        user.tier = {}
        user.tier.id = tier.id;
        user.tier.number = rM.getNumberFromBeginnerRole(tier.id)
        user.tier.name = tier.name;

        // add to state
        locker.acquireWriteLock(function() {
            state.lobby.users.push(user);	
            message.reply("Added you, for tonight's game for positions " + user.positions.join(", "))	
        });
    },

    userExists: function (state, username) {

        var found = false;
        locker.acquireReadLock(function() {
            found = state.lobby.users.find(element => element.name == username) != undefined;
        },() => {
            console.log("lock released in userExists");
            console.log("Found = " + found);
        });

        return found;
    },

    getUserIndex: function (state, username) {

        var index = -1;
        locker.acquireReadLock(function() {
            index = state.lobby.users.findIndex(element => element.name == username);
        },() => {
            console.log("lock released in getUserIndex");
            console.log("index = " + index);
        });

        return index;
    },

    getUser: function (state, username) {

        var _user = undefined;
        locker.acquireReadLock(function() {
            _user = state.lobby.users.find(element => element.name == username);
        },() => {
            console.log("lock released in getUser");
            console.log("index = " + _user);
        });

        return _user;
    },

    // debug output
    printUsers: function (state) {
        locker.acquireReadLock(function() {
            console.log("All Users:");
            state.lobby.users.forEach(element => {
                console.log(element.name + ": " + element.positions.join(", ") + " @" + element.tier.name);
            });
        },() => {
            console.log("lock released in printUsers");
        });
    }
}