import VueLoader from '/bb-vue/VueLoader.js'

const schema = () => {
  return {
    player: {},
    srv: {},
    proc: {},
    scripts: {
      ignored: [],
      killed: [],
      activeByPid: {},
      _transient: {},
    },
  }
}

export default class Store {
  core
  data

  constructor(core) {
    this.core = core
  }

  async init() {
    const { reactive } = await VueLoader.Fetch()
    this.data = reactive(schema())
    return this.data
  }
}
