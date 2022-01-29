import { deleteGlobal, setGlobal, sleep } from '/bb-vue/lib.js'

import MittLoader from '/bb-vue/MittLoader.js'
import Collector from '/nuburn/Collector.js'
import Eye from '/nuburn/Eye.js'
import Runner from '/nuburn/Runner.js'
import Store from '/nuburn/Store.js'

export default class Core {
  ns

  // Core components
  bus
  store
  runner
  collector
  eye

  tick = 0
  sleepRate = 100
  wantsShutdown = false

  constructor(ns) {
    this.ns = ns
    setGlobal('nuCore', this)
  }

  async init() {
    this.bus = (await MittLoader.Fetch()).createBus()
    this.ns.tprint(`🚌 nuBus booted`)

    this.store = await this.storeInit()
    this.ns.tprint(`📦 nuStore booted`)

    this.runner = await this.runnerInit()
    this.ns.tprint(`⏰ nuRunner booted`)

    this.collector = await this.collectorInit()
    this.ns.tprint(`🧰 nuCollector booted`)

    this.eye = await this.eyeInit()
    this.ns.tprint(`🧿 nuEye booted`)

    this.registerExitCleanup()
  }

  async runUntilShutdown() {
    while (this.wantsShutdown === false) {
      this.tick++
      await this.collector.collect(this.tick)
      await this.runner.checkHealth(this.tick)
      await this.runner.runQueue(this.tick)
      await this.runner.syncStore(this.tick)
      await this.ns.sleep(this.sleepRate)
    }
  }

  async storeInit() {
    const store = new Store(this)
    store.init()
    return store
  }

  async runnerInit() {
    const runner = new Runner(this)
    await runner.init()
    return runner
  }

  async collectorInit() {
    const collector = new Collector(this)
    return collector
  }

  async eyeInit() {
    const eye = new Eye(this)
    await eye.init()
    return eye
  }

  eyeExit() {
    this.eye.appHandle()?.doShutdown()
  }

  registerExitCleanup() {
    this.ns.atExit(async () => {
      this.eyeExit()
      await sleep(250)
      deleteGlobal('nuCore')
    })
  }
}
