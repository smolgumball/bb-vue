import { PortMap, date } from '/jank/lib.js'

const oneSecond = 1000
const oneMinute = oneSecond * 60

/** @param {NS} ns **/
export async function main(ns) {
  let orchestratorReport
  let awaitTime

  while (true) {
    ns.run('/jank/orchestrator.js')

    await ns.sleep(oneSecond)
    ns.tprint(`INFO: Daemon pausing for 10s while orchestrator runs`)
    await ns.sleep(oneSecond * 9)

    try {
      orchestratorReport = JSON.parse(ns.readPort(PortMap.orchestratorReport))
      awaitTime = orchestratorReport.longestTask + oneSecond * 10
      ns.tprint(
        `INFO: Daemon got orchestratorReport from ns.readPort(${PortMap.orchestratorReport})`
      )
      ns.tprint(`INFO: -> Longest delay: ${orchestratorReport.longestDelayFriendly}`)
      ns.tprint(`INFO: -> Longest task: ${orchestratorReport.longestTaskFriendly}`)
    } catch {
      ns.tprint(
        `ERROR: Daemon could not get orchestratorReport from ns.readPort(${PortMap.orchestratorReport})`
      )

      if (!awaitTime) {
        ns.tprint(`ERROR: Setting awaitTime to 15min as default`)
        awaitTime = oneMinute * 15
      } else {
        ns.tprint(`ERROR: awaitTime was previously set, reusing value`)
      }
    }

    let friendlyAwaitTime = date.timeDiff(Date.now(), Date.now() + awaitTime)
    let friendlyAwaitTimeString = new Date(Date.now() + awaitTime).toLocaleTimeString()
    ns.tprint(
      `INFO: Daemon will re-run orchestrator in ${friendlyAwaitTime} at ${friendlyAwaitTimeString}`
    )

    await ns.sleep(awaitTime)
    ns.run('/tasks/contractor.js')

    ns.tprint(`INFO: Daemon pausing for 10s while contractor runs`)
    await ns.sleep(oneSecond * 10)
  }
}
