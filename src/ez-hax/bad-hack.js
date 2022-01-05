import { emit, date } from '/lib/utils.js'

/** @param {NS} ns **/
export async function main(ns) {
  const oneBillion = 1000000000
  const growCap = oneBillion * 1000

  let workerHost = ns.getHostname()
  let target = ns.args[0]
  let lane = `${workerHost} -> ${target}`
  let moneyThresh = Math.min(ns.getServerMaxMoney(target) * 0.75, growCap)
  let securityThresh = ns.getServerMinSecurityLevel(target) + 5

  while (true) {
    let timeStart = Date.now()

    /**
     * Weaken
     */
    let securityThen = ns.getServerSecurityLevel(target)
    let moneyThen = ns.getServerMoneyAvailable(target)
    if (securityThen > securityThresh) {
      await ns.weaken(target)
      let securityNow = ns.getServerSecurityLevel(target)
      let timeEnd = Date.now()
      let elapsedTime = date.timeDiff(timeStart, timeEnd)
      // emit('weakenSuccess', {
      //   lane,
      //   elapsedTime,
      //   change: `${ns.nFormat(securityThen, '(0.00)')} -> ${ns.nFormat(securityNow, '(0.00)')}`,
      // })
    } else if (moneyThen < moneyThresh) {
      /**
       * Grow
       */
      await ns.grow(target)
      let moneyNow = ns.getServerMoneyAvailable(target)
      let timeEnd = Date.now()
      let elapsedTime = date.timeDiff(timeStart, timeEnd)
      // emit('growSuccess', {
      //   lane,
      //   elapsedTime,
      //   change: `${ns.nFormat(moneyThen, '($0.00a)')} -> ${ns.nFormat(moneyNow, '($0.00a)')}`,
      // })
    } else {
      /**
       * Hack
       */
      let moneyStolen = await ns.hack(target)
      let timeEnd = Date.now()
      let elapsedTime = date.timeDiff(timeStart, timeEnd)
      let serverMoneyNow = ns.nFormat(ns.getServerMoneyAvailable(target), '($0.00a)')

      // Good job 🎉
      if (moneyStolen) {
        moneyStolen = ns.nFormat(moneyStolen, '($0.00a)')
        ns.toast(`Stole ${moneyStolen} in lane ${lane}`, 'success')
        // emit('hackSuccess', { lane, elapsedTime, moneyStolen, serverMoneyNow })
      }

      // Uh oh...
      else {
        // emit('hackFailed', { lane, elapsedTime })
      }
    }
  }
}
