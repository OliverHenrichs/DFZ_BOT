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
    }, 
    
    /**
        Check if a set of numbers is within the given range
        @param positions map of numbers to be checked for correctness
        @param min min number value
        @param max max number value
        @return {[boolean, string]} true if correct, false + error msg if not
    */
    checkNumbers: function(positions, min=0, max=5) {
        // error if empty
        if (positions.size == 0 || (positions.size == 1 && positions.has(NaN))) {
            return [false, "Did not find any numbers"];
        }

        // error if not integer values
        for (let p of positions) {

            if (Number.isNaN(p)) {
                return [false, "At least one position is NaN."];
            }
            else if (p > max) {
                return [false, "At least one position is greater than " + max + "."];
            }
            else if (p < min) {
                return [false, "At least one position is smaller than " + min + "."];
            }
        }
        return [true, ""];
    },

    /**
     * Retrieves a sequence of unique integer values from a string containing comma-separated values
     * @param stringWithCommaSeperatedNumbers string like this "5,6,8"
     * @param {int} min min allowed number
     * @param {int} max max allowed number
     * @return {[boolean, set<int>, string]}[true if success, unique numbers, error message if not success]
     */
    getNumbersFromString: function(stringWithCommaSeperatedNumbers, min=0, max=5)
    {
        var numbers = stringWithCommaSeperatedNumbers.split(",");
        // get integers
        for (pos in numbers) {
            numbers[pos] = Number(numbers[pos]);
        }
        // remove duplicates
        numbers.sort();
        var uniqueNumbers = new Set(numbers);

        // check numbers
        var checkResult = this.checkNumbers(uniqueNumbers, min, max);

        return [checkResult[0], uniqueNumbers, checkResult[1]];
    }
}