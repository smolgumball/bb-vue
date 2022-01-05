let moduleUUID = '👻' + crypto.randomUUID()

export default class DepDep {
  #val

  constructor() {
    this.#val = moduleUUID
  }

  report() {
    return this.#val
  }
}
