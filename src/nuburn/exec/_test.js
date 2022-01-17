import { nuChild } from '/nuburn/lib/globals.js'

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  await nuChild(ns, async ({ resolve, reject, options }) => {
    let time = 0
    const tick = 100
    const limit = Math.random() * 3000
    while (time < limit) {
      await ns.sleep(tick)
      time += tick
    }
    await resolve(`${options.bounceBack} ${limit}`)
  })
}
