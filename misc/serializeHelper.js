var fs = require('fs');
const locker = require("../misc/lock")

// lock for async save writing
module.exports = {

	/**
		write current state to file
		@param file file to open
		@param state current state
		@param cb optional callback function you want to run
	*/
    writeState: function (state, file) {
        var json = {};
        locker.acquireReadLock(function() {
            json = JSON.stringify(state);
        }, () => {
            fs.writeFile(file, json, (err) => {
                if (err) throw err;
                console.log('State has been saved!');    
            });
        })
    },

	/**
		load state from file
		@param file file to open
		@param state current state
		@param cb optional callback function you want to run
	*/
    loadState: function (client, file) {
        var data = fs.readFileSync(file);
        client._state = JSON.parse(data);
    }
}


