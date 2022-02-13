// 50:50 because .random is between 0 and 1, rounding happens at 0.5
export function coinFlip() {
  return Math.round(Math.random()) === 1;
}

/**
 * Shuffles array in place.
 * thx @ https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 */
export function shuffle<T>(array: Array<T>) {
  let i, j, copy;
  for (i = array.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    copy = array[i];
    array[i] = array[j];
    array[j] = copy;
  }
  return array;
}

/**
 * Retrieves a sequence of unique integer values from a string containing comma-separated values.
 */
export function getNumbersFromString(
  csvString: string,
  min: number = 0,
  max: number = 5
): Set<number> {
  const numbers = getUniqueSortedNumbersFromCSVString(csvString);
  assertPositionsBetweenMinMax(numbers, min, max);
  return numbers;
}

function assertPositionsBetweenMinMax(
  positions: Set<number>,
  min: number = 0,
  max: number = 5
) {
  if (positions.size == 0) throw new Error("You did not provide positions.");
  if (positions.has(NaN))
    throw new Error("One of your positions is not a number.");

  for (let p of positions) {
    if (p > max) throw `At least one position is greater than ${max}.`;
    if (p < min) throw `At least one position is smaller than ${min}.`;
  }
}

function getUniqueSortedNumbersFromCSVString(csvString: string) {
  const strings: string[] = csvString.split(",");
  const numbers = strings.map((s) => Number(s));
  numbers.sort();
  return new Set(numbers);
}
