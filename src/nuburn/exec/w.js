import { nuChild } from '/nuburn/lib/getters.js'
//

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  await nuChild(ns, async ({ resolve, reject, options }) => {
    try {
      await resolve(await ns.weaken(options.target))
    } catch (error) {
      await reject(error)
    }
  })
}
