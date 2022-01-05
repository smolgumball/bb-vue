const oneMillion = 1e6
const alertThreshold = oneMillion * 1000

/** @param {NS} ns **/
export async function main(ns) {
  const [worker, target, initialDelay, loopDelay, uuid] = ns.args
  const laneDesc = `[${worker} -> ${target}] `

  if (initialDelay) {
    await ns.sleep(initialDelay)
  }

  while (true) {
    let moneyStolen = await ns.hack(target)
    // if (moneyStolen < alertThreshold) {
    //   console.warn(
    //     laneDesc +
    //       `Hack less than alert thresh ${ns.nFormat(
    //         alertThreshold,
    //         '($0.00a)'
    //       )}: only stole ${ns.nFormat(moneyStolen, '($0.00a)')}`
    //   )
    // } else {
    //   console.log(laneDesc + `💸🤑 Hack stole ${ns.nFormat(moneyStolen, '($0.00a)')}`)
    // }

    if (loopDelay == -1) {
      ns.exit()
    } else if (loopDelay > 0) {
      await ns.sleep(loopDelay)
    }
  }
}
