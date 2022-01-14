import VueLoader from '/bb-vue/VueLoader.js'

export default class Store {
  ns
  data

  constructor(ns) {
    this.ns = ns
  }

  async init(schema) {
    const { reactive } = await VueLoader.Get()
    this.data = reactive(schema)
    return this.data
  }
}
