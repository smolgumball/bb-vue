import Scheduler from '/nuwave/scheduler.js'

export async function main(ns) {
  await Scheduler.MakeChildScript(
    ns,
    ns.getRunningScript(),
    async ({ uuid, resolve, reject, options }) => {
      let time = 0
      const tick = 100
      const limit = Math.random() * 1000
      while (time < limit) {
        await ns.sleep(tick)
        time += tick
        ns.toast(tick)
      }
      if (Math.random() > 0.5) {
        reject({ result: `💀` })
      } else {
        resolve({ result: `${options.bounceBack} ${limit}` })
      }
    }
  )
}
