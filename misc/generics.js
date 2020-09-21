module.exports = {
    /**
     * Async foreach ...
     * @param {Array} array 
     * @param {Function} callback 
     */
    asyncForEach: async function (array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    },

    // 50:50 because .random is between 0 and 1, rounding happens at 0.5
    coinFlip: function() {
        return Math.round(Math.random()) === 1;
    },
    
    /**
     * Shuffles array in place.
     * thx @ https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
     * @param {Array} a items An array containing the items.
     * @param return the shuffled array
     */
    shuffle: function (a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }
}