import { deleteGlobal, getGlobal, setGlobal, sleep } from '/bb-vue/lib.js'

import MittLoader from '/bb-vue/MittLoader.js'
import Collector from '/nuburn/Collector.js'
import Eye from '/nuburn/Eye.js'
import Scheduler from '/nuburn/Scheduler.js'
import Store from '/nuburn/Store.js'

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  ns.disableLog('ALL')
  ns.enableLog('exec')

  const nu = setGlobal('nuMain', { wantsShutdown: false, ns })
  await initAll(nu)

  // Allows for cleanup on kill
  atExit(nu)

  let tick = 0
  const rate = 200
  while (nu.wantsShutdown === false) {
    await nu.scheduler.checkHealth(tick)
    await nu.scheduler.runQueue(tick)
    await nu.collector.collect(tick)
    await ns.sleep(rate)
    tick += rate
  }

  // Once while falls through, exit program
  // Triggers on incoming nuMain:shutdown event
  ns.tprint(`🛑 received shutdown notice, exiting...`)
  ns.exit()
}

async function initAll(nu) {
  nu.bus = (await MittLoader.Get()).createBus()
  nu.ns.tprint(`🚌 nuBus booted`)

  nu.store = await storeInit(nu)
  nu.ns.tprint(`📦 nuStore booted`)

  nu.scheduler = await schedulerInit(nu)
  nu.ns.tprint(`⏰ nuScheduler booted`)

  nu.collector = await collectorInit(nu)
  nu.ns.tprint(`🧰 nuCollector booted`)

  nu.eye = await eyeInit(nu)
  nu.ns.tprint(`🧿 nuEye booted`)
}

async function storeInit(nu) {
  const store = new Store(nu.ns)
  store.init({
    player: {},
    srv: {},
    proc: {},
  })
  return store
}

async function schedulerInit(nu) {
  const scheduler = new Scheduler(nu.ns)
  await scheduler.init()
  return scheduler
}

async function collectorInit(nu) {
  const collector = new Collector(nu.ns)
  return collector
}

async function eyeInit(nu) {
  const eye = new Eye(nu.ns)
  await eye.init()
  return eye
}

function atExit(nu) {
  nu.bus.on('nuMain:shutdown', () => (nu.wantsShutdown = true))
  nu.ns.atExit(async () => {
    getGlobal('nuMain.eye')?.appHandle()?.doShutdown()
    await sleep(250)
    deleteGlobal('nuMain')
  })
}
