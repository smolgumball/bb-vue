import { nuChild } from '/nuburn/lib/globals.js'

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  await nuChild(ns, async ({ resolve, reject, options }) => {
    let time = 0
    const tick = 1000
    const timespan = Math.random() * 10000
    while (time < timespan) {
      await ns.sleep(tick)
      time += tick
    }
    if (Math.random() > 0.9) {
      await reject(`intentional error 💥`)
    } else {
      await resolve(`${options.bounceBack} ${timespan}`)
    }
  })
}
