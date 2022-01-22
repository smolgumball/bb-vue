import { nuChild } from '/nuburn/lib/globals.js'
//

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  await nuChild(ns, async ({ resolve, reject, options }) => {
    try {
      await resolve(await ns.share())
    } catch (error) {
      await reject(error)
    }
  })
}
