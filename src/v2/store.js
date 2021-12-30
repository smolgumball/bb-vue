import { deepTruncate, emitEvent, projectGlobals, setProjectGlobal } from '/v2/lib.js'

export default class Store {
  #ns
  #reactive
  #initialState = {
    uiState: {
      isAppOpen: false,
    },
    recentEvents: {
      items: [],
      maxItems: 100,
      eventIsOdd: false,
      includeFilter: [],
      excludeFilter: ['nsCommand:request'],
    },
    scriptInfo: {},
    playerInfo: {},
    homeInfo: {},
  }

  /**
   * @param {NS} ns
   */
  constructor(ns) {
    this.#ns = ns
    setProjectGlobal('store', this)
  }

  async init() {
    if (this.#reactive) throw new Error('Store is already initialized; access with `Store.reactive`')
    if (!projectGlobals.Modules?.Vue) throw new Error('Vue is not loaded; check VueLoader usage')

    this.#reactive = projectGlobals.Modules.Vue.reactive({ ...this.#initialState })
    emitEvent('init:store', { rootKeyCount: Object.keys({ ...this.#reactive }).length })

    return this
  }

  update(data) {
    this.#reactive = Object.assign(this.#reactive, data)
  }

  logRecentEvent(type, event) {
    if (!this.#recentEventPassesFilter(type)) return
    let recentEventsTrimmed = this.#reactive.recentEvents.items.slice(0, this.#reactive.recentEvents.maxItems - 1)
    let newEvent = this.#createRecentEventRecord(type, event)
    this.#reactive.recentEvents.items = [newEvent, ...recentEventsTrimmed]
    this.#reactive.recentEvents.eventIsOdd = !this.#reactive.recentEvents.eventIsOdd
  }

  #createRecentEventRecord(type, event) {
    let date = new Date()
    return {
      type,
      time: date.toLocaleTimeString(),
      event: deepTruncate(event),
      epoch: +date,
      uuid: crypto.randomUUID(),
      isOdd: this.#reactive.recentEvents.eventIsOdd,
    }
  }

  #recentEventPassesFilter(type) {
    let include = this.#reactive.recentEvents.includeFilter
    if (include.length && !include.some((inc) => type.startsWith(inc))) return false
    let exclude = this.#reactive.recentEvents.excludeFilter
    if (exclude.length && exclude.some((inc) => type.startsWith(inc))) return false
    return true
  }

  get data() {
    return this.#reactive
  }
}
