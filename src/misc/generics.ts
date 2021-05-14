// 50:50 because .random is between 0 and 1, rounding happens at 0.5
export function coinFlip() {
  return Math.round(Math.random()) === 1;
}

/**
 * Shuffles array in place.
 * thx @ https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 * @param {Array} a items An array containing the items.
 * @param return the shuffled array
 */
export function shuffle<T>(a: Array<T>) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

/**
  Check if a set of numbers is within the given range
  @param positions map of numbers to be checked for correctness
  @param min min number value
  @param max max number value
  @return {[boolean, string]} true if correct, false + error msg if not
*/
export function checkNumbers(
  positions: Set<number>,
  min: number = 0,
  max: number = 5
): [boolean, string] {
  // error if empty
  if (positions.size == 0 || (positions.size == 1 && positions.has(NaN))) {
    return [false, "Did not find any numbers"];
  }

  // error if not integer values
  for (let p of positions) {
    if (Number.isNaN(p)) {
      return [false, "At least one position is NaN."];
    } else if (p > max) {
      return [false, "At least one position is greater than " + max + "."];
    } else if (p < min) {
      return [false, "At least one position is smaller than " + min + "."];
    }
  }
  return [true, ""];
}

export interface NumberResult {
  numbers: Set<number> | undefined;
  status: Boolean;
  errorMessage: string;
}

/**
 * Retrieves a sequence of unique integer values from a string containing comma-separated values
 * @param stringWithCommaSeperatedNumbers string like this "5,6,8"
 * @param {int} min min allowed number
 * @param {int} max max allowed number
 * @return {[boolean, set<int>, string]}[true if success, unique numbers, error message if not success]
 */
export function getNumbersFromString(
  stringWithCommaSeperatedNumbers: string,
  min: number = 0,
  max: number = 5
): NumberResult {
  var strings: string[] = stringWithCommaSeperatedNumbers.split(",");
  var numbers: number[] = [];
  // get integers
  strings.forEach((s: string) => {
    numbers.push(Number(s));
  });

  // remove duplicates
  numbers.sort();
  var uniqueNumbers = new Set(numbers);

  // check numbers
  var checkResult = checkNumbers(uniqueNumbers, min, max);

  return {
    numbers: uniqueNumbers,
    status: checkResult[0],
    errorMessage: checkResult[1],
  };
}
