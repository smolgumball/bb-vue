import { getGlobal } from '/bb-vue/lib.js'

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  await getGlobal('nuMain').scheduler.child(ns, async ({ resolve, reject, options }) => {
    let time = 0
    const tick = 100
    const limit = Math.random() * 3000
    while (time < limit) {
      await ns.sleep(tick)
      time += tick
    }
    if (Math.random() > 0.8) {
      await reject(`💀`)
    } else {
      await resolve(`${options.bounceBack} ${limit}`)
    }
  })
}
