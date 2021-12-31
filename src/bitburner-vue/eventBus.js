import { emitEvent, projectGlobals, setProjectGlobal } from '/bitburner-vue/lib.js'

export default class EventBus {
  #ns
  #MittModule
  #bus

  #buffer
  #isBuffering = false

  /**
   * @param {NS} ns
   */
  constructor(ns) {
    this.#ns = ns
  }

  async init() {
    if (this.#bus) throw new Error('EventBus has already been initialized`')

    let isFreshImport = false
    if (!projectGlobals?.Modules?.Mitt) {
      this.#MittModule = await import('https://unpkg.com/mitt@3.0.0/dist/mitt.mjs')
      setProjectGlobal('Modules.Mitt', this.#MittModule)
      isFreshImport = true
    } else {
      this.#MittModule = projectGlobals.Modules.Mitt
    }

    this.#bus = this.#MittModule.default()
    this.pause()

    this.#bus.on('*', this.handleGlobalEvent.bind(this))

    setProjectGlobal('eventBus', this)
    emitEvent('init:eventBus', { isFreshImport })
  }

  emit(type, event) {
    if (this.#isBuffering) {
      this.#buffer.push([type, event])
    } else {
      this.#bus.emit(type, event)
    }
  }

  on(type, handler) {
    this.#bus.on(type, handler)
  }

  handleGlobalEvent(type, event) {
    if (this.#isBuffering) {
      console.error(`handleGlobalEvent called while #isBuffering true; this should not happen`)
    } else if (projectGlobals.store) {
      projectGlobals.store.logRecentEvent(type, event)
    }
  }

  pause() {
    this.#isBuffering = true
    this.#buffer = []
  }

  processQueue(disableBuffering = true) {
    let toProcess = [...this.#buffer]
    this.#buffer = []
    this.#isBuffering = !disableBuffering
    toProcess.forEach((args) => this.#bus.emit(...args))
  }

  get Mitt() {
    return this.#MittModule
  }

  get bus() {
    return this.#bus
  }

  get isBuffering() {
    return this.#isBuffering
  }
}
