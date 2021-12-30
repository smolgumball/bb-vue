import { emitEvent, timeDiff, setProjectGlobal, setAppVisible } from '/v2/lib.js'

import EventBus from '/v2/eventBus.js'
import VueLoader from '/v2/vueLoader.js'
import Store from '/v2/store.js'
import UI from '/v2/ui.js'
import Orchestrator from '/v2/orchestrator.js'

/** @param {NS} ns **/
export async function main(ns) {
  const main = new Main(ns, ns.args[0])
  await main.init()

  // Run core loop
  while (true) {
    await main.update()
  }
}

class Main {
  #ns
  #uuid

  vueLoader
  eventBus
  store
  ui
  orchestrator

  static config = {
    tickRate: 250,
  }

  /**
   * @param {NS} ns
   */
  constructor(ns, uuid) {
    this.#ns = ns
    this.#uuid = uuid || crypto.randomUUID()
    this.eventBus = new EventBus(ns)
    this.vueLoader = new VueLoader(ns)
    this.store = new Store(ns)
    this.ui = new UI(ns)
    this.orchestrator = new Orchestrator(ns)

    setProjectGlobal('main', this)
  }

  async init() {
    setAppVisible(false)

    await this.eventBus.init()
    await this.vueLoader.init()
    await this.store.init()
    await this.ui.init()
    await this.orchestrator.init()

    emitEvent('init:main', { uuid: this.uuid })
    this.eventBus.processQueue()

    return this
  }

  async update() {
    let timeStart = Date.now()
    await this.orchestrator.update()
    let timeEnd = Date.now()

    // Only pause if updates didn't use up our time
    if (timeEnd - timeStart < Main.config.tickRate) {
      await this.#ns.asleep(Main.config.tickRate)
      timeEnd = Date.now()
    } else {
      emitEvent('main:slowUpdate', {
        tickDuration: timeDiff(timeStart, timeEnd, { verbose: true }),
      })
    }
  }

  get uuid() {
    return this.#uuid
  }
}
