import depdep from '/bug__stuck-blobs/deepDep.js'

let moduleUUID = crypto.randomUUID()

export default class Dep {
  #val

  constructor() {
    this.#val = `${moduleUUID}:${new depdep().report()}`
  }

  report() {
    return this.#val
  }
}
