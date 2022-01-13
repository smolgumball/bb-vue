import { getGlobal } from '/bb-vue/lib.js'
//

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  await getGlobal('nuMain').scheduler.child(ns, async ({ resolve, reject, options }) => {
    try {
      resolve(await ns.hack(options.target))
    } catch (error) {
      reject(error)
    }
  })
}
