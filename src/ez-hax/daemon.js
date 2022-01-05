const oneMinute = 1000 * 60

/** @param {NS} ns **/
export async function main(ns) {
  ns.run('/ez-hax/main.js')
  await ns.sleep(oneMinute * 0.5)

  while (true) {
    ns.run('/tasks/contractor.js')
    await ns.sleep(oneMinute * 5)
  }
}
