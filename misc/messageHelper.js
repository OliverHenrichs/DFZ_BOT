/**
    Check if player positions are a non-empty subset of {1,2,3,4,5}
    @param positions map of positions to be checked for correctness
    @return true if correct, false + error msg if not
*/
function checkNumbers(positions, min=0, max=5) {
    // error if empty
    if (positions.size == 0 || (positions.size == 1 && positions.has(NaN))) {
        return [false, "No positions were given"];
    }

    // error if not integer values
    for (let p of positions) {

        if (Number.isNaN(p)) {
            return [false, "At least one position is not a number."];
        }
        else if (p > max) {
            return [false, "At least one position is greater than 5."];
        }
        else if (p <= min) {
            return [false, "At least one position is smaller than 1."];
        }
    }
    return [true, ""];
}

/**
 * @param message message containing numbers
 * @param splitter integer value at which the message content must be split in order to retrieve numbers
 * @return [true if success, unique numbers, error message if not success]
 */
function getNumbersFromMessage(message, splitter, min=0, max=5) {
    // split
    var numbers = message.content.substring(splitter).split(",");

    // get integers
    for (pos in numbers) {
        numbers[pos] = parseInt(numbers[pos], 10);
    }
    // remove duplicates
    var uniqueNumbers = new Set(numbers);

    // check numbers
    var checkResult = checkNumbers(uniqueNumbers, min=0, max=5);

    return [checkResult[0], uniqueNumbers, checkResult[1]];
}

module.exports.checkNumbers = checkNumbers;
module.exports.getNumbersFromMessage = getNumbersFromMessage;