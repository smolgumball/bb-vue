import { getGlobal, Keys, setGlobal } from '/bb-vue/lib.js'

export default class MittLoader {
  /**
   * Retrieve a cached or freshly imported reference to the Mitt module.
   * @returns {Promise<{ createBus: Function }>} Mitt constructor
   */
  static async Get() {
    let module = getGlobal(Keys.mittModuleKey)
    if (module) return module

    module = await import('https://unpkg.com/mitt@3.0.0/dist/mitt.mjs')
    let moduleWrapper = { createBus: module.default }

    setGlobal(Keys.mittModuleKey, moduleWrapper)
    setGlobal(Keys.globalBusKey, moduleWrapper.createBus())

    return moduleWrapper
  }
}
