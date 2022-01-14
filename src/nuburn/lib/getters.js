import { getGlobal } from '/bb-vue/lib.js'

export function nuEmit() {
  return getGlobal('nuMain').bus.emit(...arguments)
}

export function nuStore() {
  return getGlobal('nuMain').store.data
}

export async function nuChild() {
  return getGlobal('nuMain').scheduler.child(...arguments)
}
