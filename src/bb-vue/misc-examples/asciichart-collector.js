import { getGlobal } from '/bb-vue/lib.js'

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  let bus = getGlobal('asciiBus')
  if (!bus) {
    throw new Error('Run the asciichart-ui.js script first!')
  }

  while (true) {
    bus.emit('asciiChartCollector', { value: (Math.random() - 0.5) * 10 })
    await ns.sleep(50)
  }
}
