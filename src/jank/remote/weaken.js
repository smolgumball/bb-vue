const alertThreshold = 20

/** @param {NS} ns **/
export async function main(ns) {
  const [worker, target, initialDelay, loopDelay, uuid] = ns.args
  const laneDesc = `[${worker} -> ${target}] `

  if (initialDelay) {
    await ns.sleep(initialDelay)
  }

  while (true) {
    let weakenedBy = (await ns.weaken(target)) * 100
    // if (weakenedBy < alertThreshold) {
    //   console.debug(
    //     laneDesc +
    //       `Weaken less than alert thresh ${alertThreshold}: only weakened by ${ns.nFormat(
    //         weakenedBy,
    //         '(0.00)'
    //       )}%`
    //   )
    // } else {
    //   console.log(laneDesc + `Weakened by ${ns.nFormat(weakenedBy, '(0.00)')}%`)
    // }

    if (loopDelay == -1) {
      ns.exit()
    } else if (loopDelay > 0) {
      await ns.sleep(loopDelay)
    }
  }
}
