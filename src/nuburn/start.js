import Core from '/nuburn/Core.js'

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  ns.disableLog('ALL')
  ns.enableLog('exec')

  // Bring Core online
  const nuCore = new Core(ns)
  await nuCore.init()

  // Run core loop
  await nuCore.runUntilShutdown()

  // Once core loop falls through, exit program
  ns.tprint(`🛑 nuCore received shutdown notice, exiting...`)
  ns.exit()
}
