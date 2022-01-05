const alertThreshold = 20

/** @param {NS} ns **/
export async function main(ns) {
  const [worker, target, initialDelay, loopDelay, uuid] = ns.args
  const laneDesc = `[${worker} -> ${target}] `

  if (initialDelay) {
    await ns.sleep(initialDelay)
  }

  while (true) {
    let grewBy = ((await ns.grow(target)) - 1) * 100
    // if (grewBy < 0.1) {
    //   console.log(laneDesc + `Fully grown`)
    // } else if (grewBy < alertThreshold) {
    //   console.debug(
    //     laneDesc +
    //       `Grow less than alert thresh ${alertThreshold}: only grew by ${ns.nFormat(
    //         grewBy,
    //         '(0.00)'
    //       )}%`
    //   )
    // } else {
    //   console.log(laneDesc + `Grown by ${ns.nFormat(grewBy, '(0.00)')}%`)
    // }

    if (loopDelay == -1) {
      ns.exit()
    } else if (loopDelay > 0) {
      await ns.sleep(loopDelay)
    }
  }
}
