import VueLoader from '/bb-vue/VueLoader.js'

export default class Store {
  core
  data

  constructor(core) {
    this.core = core
  }

  async init(schema) {
    const { reactive } = await VueLoader.Get()
    this.data = reactive(schema)
    return this.data
  }
}
