/** @param {NS} ns **/
export async function main(ns) {
  let target = ns.args[0]
  await ns.sleep(Math.random() * 5000)
  while (true) {
    await ns.weaken(target)
  }
}
