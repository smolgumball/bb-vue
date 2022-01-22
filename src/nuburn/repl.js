/*

// Sample script

let targets = ['n00dles', 'joesguns']
let procs = ['hack', 'grow', 'weaken']
let ram = [ns.weaken, ns.grow, ns.hack ]

while(true) {
  for (const t of targets) {
    for (const p of procs) {
      ns.print(`${p} -> ${t}`)
      await ns[p](t)
    }
  }
}

*/

import AppFactory from '/bb-vue/AppFactory.js'
import { isBlank, setGlobal, win } from '/bb-vue/lib.js'
import MittLoader from '/bb-vue/MittLoader.js'
import VueLoader from '/bb-vue/VueLoader.js'

import { ReplEvents, ReplStates } from '/nuburn/lib/globals.js'
import EyeInput from '/nuburn/ui/EyeInput.js'
import ReplRoot from '/nuburn/ui/ReplRoot.js'
import PrismEditorComponent from '/nuburn/vendor/PrismEditorComponent.js'

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
    const { reactive } = await VueLoader.Fetch()

    // Store
    this.store = reactive({
      runHistory: [],
      currentRun: null,
      stagedRun: null,
      replBusy: false,
    })

    // Wire events
    this.bus = (await MittLoader.Fetch()).createBus()
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
      },
      rootComponent: ReplRoot,
      components: [PrismEditorComponent(), EyeInput],
    })
  }

  async runUntilShutdown() {
    while (this.wantsShutdown == false) {
      await this.replTick()
      await this.ns.asleep(250)
    }

    console.debug('nuRepl: Ensuring current and past REPL scripts are killed')
    for (const script of [this.store.currentRun, ...this.store.runHistory]) {
      if (script?.pid) this.ns.kill(script.pid)
    }

    await this.ns.asleep(500)
  }

  buildRunTemplate(uuid, script, threads) {
    return {
      uuid,
      threads: Math.max(threads, 1),
      script: script,
      scriptPrepped: this.prepScript(uuid, script),
      state: ReplStates.staged,
      path: `/nuburn/tmp-repl/${uuid}.js`,
      timeOfBirth: Date.now(),
      ram: 0,
      ramTotal: 0,
      wantsShutdown: false,
      pid: null,
      result: null,
      error: null,
      logs: [],
    }
  }

  /** @param {{ script: string, uuid: string }} options */
  queueReplRun({ script, threads }) {
    let stagedRun = this.buildRunTemplate(crypto.randomUUID(), script, threads)
    this.ns.write(stagedRun.path, stagedRun.scriptPrepped, 'w')
    this.store.currentRun = { ...stagedRun }
  }

  async replTick() {
    if (!this.store.replBusy && this.store.currentRun?.uuid) {
      // TODO: Add RAM overuse protection
      let pid = this.ns.run(this.store.currentRun.path, this.store.currentRun.threads)
      if (pid > 0) {
        this.store.currentRun.pid = pid
        this.store.currentRun.state = ReplStates.running
        this.store.replBusy = true
      } else {
        this.finishReplRun({
          result: null,
          error: '[could not start: likely not enough RAM]',
          logs: [],
        })
      }
    }

    if (this.store.currentRun?.uuid && this.store.currentRun.state == ReplStates.running) {
      const rs = this.ns.getRunningScript(this.store.currentRun?.pid)
      if (rs) {
        this.store.currentRun.ram = rs.ramUsage
        this.store.currentRun.ramTotal = rs.ramUsage * rs.threads
        this.store.currentRun.logs = this.ns.getScriptLogs(this.store.currentRun.path)
        this.store.currentRun.timeLifespan = (Date.now() - this.store.currentRun.timeOfBirth) / 1000 // as seconds
      } else {
        this.finishReplRun({
          result: null,
          error: '[script died unexpectedly]',
          logs: this.store.currentRun.logs,
        })
      }
    }

    if (this.store?.currentRun?.wantsShutdown) {
      let finalLogs = this.ns.getScriptLogs(this.store.currentRun.path)
      this.ns.kill(this.store.currentRun.pid)
      this.finishReplRun({
        result: '[execution halted]',
        error: null,
        logs: finalLogs,
      })
    }

    await this.ns.asleep(50)
  }

  finishReplRun({ result, error, logs }) {
    let undefinedReturns = result == undefined && error == undefined
    this.store.currentRun.result = undefinedReturns ? '[nothing returned]' : result

    let wantedShutdown = this.store.currentRun.wantsShutdown
    let considerSuccess = (!wantedShutdown && !isBlank(result)) || result === 0 || !undefinedReturns
    this.store.currentRun.error = error
    this.store.currentRun.logs = logs
    this.store.currentRun.state = considerSuccess ? ReplStates.succeeded : ReplStates.failed
    if (wantedShutdown) this.store.currentRun.state = ReplStates.killed

    this.store.currentRun.timeOfDeath = Date.now()
    this.store.currentRun.timeLifespan =
      (this.store.currentRun.timeOfDeath - this.store.currentRun.timeOfBirth) / 1000 // as seconds
    this.store.runHistory = [{ ...this.store.currentRun }, ...this.store.runHistory]

    // Cleanup old tmp-repl files
    let oldFiles = this.ns.ls('home', '/nuburn/tmp-repl/')
    for (let oldFile of oldFiles) {
      !oldFile.includes(this.store.currentRun.uuid) && this.ns.rm(oldFile)
    }

    this.store.currentRun = null
    this.store.replBusy = false
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

  let __error
  let __result

  try {
    __result = await (async function(ns) {
      // <injected-script>
      ${script}
      // </injected-script>
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
