import { getGlobal, setGlobal } from '/bb-vue/lib.js'

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  let bus = getGlobal('asciiBus')
  if (!bus) {
    bus = getGlobal('Mitt').createBus()
    setGlobal('asciiBus', bus)
  }

  while (true) {
    bus.emit('dataFromScript', { value: Math.random() * 10 })
    await ns.sleep(500)
  }
}
