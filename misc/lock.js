var ReadwriteLock = require('readwrite-lock');
var lock = new ReadwriteLock({timeout : 5000});

// lock for async save writing
module.exports = {

	/**
		write locks whatever you're doing
		@param f function you want to run
		@param cb optional callback function you want to run
	*/
    acquireWriteLock: function (f, cb) {
        lock.acquireWrite("botLock", f, {}).then(cb)
	},
	
	/**
		read locks whatever you're doing
		@param f function you want to run
		@param cb optional callback function you want to run
	*/
    acquireReadLock: function (f, cb) {
		lock.acquireRead("botLock", f, {}).then(cb)
	}
}

