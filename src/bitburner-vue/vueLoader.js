import { emitEvent, projectGlobals, setProjectGlobal } from '/bitburner-vue/lib.js'

export default class VueLoader {
  #ns
  #VueModule

  /**
   * @param {NS} ns
   */
  constructor(ns) {
    this.#ns = ns
  }

  async init() {
    if (this.#VueModule) throw new Error('vueLoader has already run`')

    let isFreshImport = false
    if (!projectGlobals.Modules?.Vue) {
      this.#VueModule = await import('https://cdn.jsdelivr.net/npm/vue@3.2.26/dist/vue.esm-browser.js')
      setProjectGlobal('Modules.Vue', this.#VueModule)
      isFreshImport = true
    } else {
      this.#VueModule = projectGlobals.Modules.Vue
    }

    emitEvent('init:vueLoader', { isFreshImport })
  }

  get Vue() {
    return this.#VueModule
  }
}
