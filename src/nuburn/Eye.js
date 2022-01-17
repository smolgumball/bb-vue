import AppFactory from '/bb-vue/AppFactory.js'

import EyeRoot from '/nuburn/ui/Eye.js'
import EyeMacros from '/nuburn/ui/EyeMacros.js'
import EyeInput from '/nuburn/ui/EyeInput.js'
import EyeProcList from '/nuburn/ui/EyeProcList.js'

export default class Eye {
  core
  appHandle

  constructor(core) {
    this.core = core
  }

  async init() {
    const app = new AppFactory(this.core.ns)
    this.appHandle = await app.mount({
      config: {
        id: crypto.randomUUID(),
        showTips: false,
        forceReload: true,
      },
      rootComponent: EyeRoot,
      components: [EyeMacros, EyeInput, EyeProcList],
    })
  }
}
