import Scheduler from '/nuwave/scheduler.js'

export async function main(ns) {
  await Scheduler.MakeChildScript(ns, ns.getRunningScript(), async (done) => {
    let time = 0
    while (time < 5000) {
      await ns.sleep(1000)
      time += 1000
    }
    done({ time })
  })
}
