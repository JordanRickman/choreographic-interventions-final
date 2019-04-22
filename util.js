// ----- UTILITY FUNCTIONS -----

// Average an array of numbers
function average(arr) {
  const sum = arr.reduce((total, next) => next+total);
  return sum / arr.length;
}

