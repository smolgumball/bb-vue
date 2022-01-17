import AppFactory from '/bb-vue/AppFactory.js'
import { doc, isBlank, setGlobal, win } from '/bb-vue/lib.js'
import MittLoader from '/bb-vue/MittLoader.js'
import VueLoader from '/bb-vue/VueLoader.js'

import { ReplEvents, ReplStates } from '/nuburn/lib/globals.js'
import ReplRoot from '/nuburn/ui/ReplRoot.js'

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  ns.disableLog('ALL')
  ns.enableLog('exec')

  let nuRepl = new Repl(ns)
  await nuRepl.init()

  ns.tprint('🔋 nuRepl booted')
  await nuRepl.runUntilShutdown()

  ns.tprint('🛑 nuRepl shutting down')
}

class Repl {
  ns
  bus
  store
  replCounter
  wantsShutdown = false
  uiHandle = null

  /** @param { import("~/ns").NS } ns */
  constructor(ns) {
    this.ns = ns
    this.replCounter = 1
    setGlobal('nuRepl', this)
  }

  async init() {
    const { reactive } = await VueLoader.Get()

    // Store
    this.store = reactive({
      runHistory: [],
      currentRun: null,
      stagedRun: null,
      queuePaused: false,
    })

    // Wire events
    this.bus = (await MittLoader.Get()).createBus()
    this.bus.on(ReplEvents.runScript, this.queueReplRun.bind(this))
    this.bus.on(ReplEvents.reportScriptRun, this.finishReplRun.bind(this))
    this.bus.on(ReplEvents.doShutdown, () => (this.wantsShutdown = true))

    // UI boot
    await this.bootUi()
  }

  async bootUi() {
    const app = new AppFactory(this.ns)
    this.uiHandle = await app.mount({
      config: {
        id: crypto.randomUUID(),
        showTips: false,
        forceReload: true,
      },
      rootComponent: ReplRoot,
    })
  }

  async runUntilShutdown() {
    while (this.wantsShutdown == false) {
      await this.replTick()
      await this.ns.asleep(50)
    }
  }

  buildRunTemplate(uuid, script) {
    return {
      uuid,
      script: script,
      scriptEncoded: this.toBase64(this.prepScript(uuid, script)),
      state: ReplStates.staged,
      path: `/nuburn/tmp-repl/${uuid}.js`,
      pid: null,
      result: null,
      error: null,
      logs: [],
    }
  }

  /** @param {{ script: string, uuid: string }} options */
  queueReplRun({ script }) {
    let stagedRun = this.buildRunTemplate(crypto.randomUUID(), script)
    doc.saveFile(stagedRun.path, stagedRun.scriptEncoded)
    this.store.currentRun = { ...stagedRun }
  }

  async replTick() {
    if (!this.store.queuePaused && this.store.currentRun?.uuid) {
      // TODO: Add RAM overuse protection
      let pid = this.ns.run(this.store.currentRun.path, 1)
      if (pid > 0) {
        this.store.currentRun.pid = pid
        this.store.currentRun.state = ReplStates.running
        this.store.queuePaused = true
      } else {
        this.store.currentRun = null
        throw new Error('nuRepl script PID was 0; maybe you are out of RAM?')
      }
    }

    if (this.store.currentRun?.uuid && this.store.currentRun.state == ReplStates.running) {
      this.store.currentRun.logs = this.ns.getScriptLogs(this.store.currentRun.path)
    }

    await this.ns.asleep(50)
  }

  finishReplRun({ result, error, logs }) {
    let undefinedReturns = result == undefined && error == undefined
    this.store.currentRun.result = undefinedReturns
      ? 'nothing returned. did you forget a return keyword?'
      : result

    let considerSuccess = !isBlank(result) || result === 0 || undefinedReturns
    this.store.currentRun.error = error
    this.store.currentRun.logs = logs
    this.store.currentRun.state = considerSuccess ? ReplStates.succeeded : ReplStates.failed
    this.store.runHistory = [{ ...this.store.currentRun }, ...this.store.runHistory]

    // Cleanup old tmp-repl files
    let oldFiles = this.ns.ls('home', '/nuburn/tmp-repl/')
    for (let oldFile of oldFiles) {
      !oldFile.includes(this.store.currentRun.uuid) && this.ns.rm(oldFile)
    }

    this.store.currentRun = null
    this.store.queuePaused = false
  }

  /** @param {string} uuid */
  /** @param {string} script */
  prepScript(uuid, script) {
    return `
import { getGlobal } from '/bb-vue/lib.js'

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  // Retrieve replBus
  const __bus = getGlobal('nuRepl').bus

  // Injected script
  let __error
  let __result

  try {
    __result = await (async function(ns) {
      ${script}
    })(ns)
  } catch (error) {
    __error = String(error)
  } finally {
    // Report to bus
    __bus.emit("${ReplEvents.reportScriptRun}", {
      uuid: "${uuid}",
      result: __result,
      error: __error,
      logs: ns.getScriptLogs()
    })
  }
}`
  }

  /** @param {string} toEncode */
  toBase64(toEncode) {
    return win.btoa(unescape(encodeURIComponent(toEncode)))
  }
}
