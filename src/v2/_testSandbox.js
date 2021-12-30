import { deepTruncate, toJson } from '/v2/lib.js'

export async function main(ns) {
  let object1 = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
  }
  console.log(toJson(deepTruncate(object1)))

  let object2 = [1, 2, 3, 4, 5, 6, 7, 8]
  console.log(toJson(deepTruncate(object2)))

  let object3 = {
    one: 1,
    two: 2,
    five: [
      'one',
      {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        six: 6,
        seven: 7,
      },
      'three',
      'four',
      'five',
      'six',
      'seven',
    ],
  }
  console.log(toJson(deepTruncate(object3)))
}
