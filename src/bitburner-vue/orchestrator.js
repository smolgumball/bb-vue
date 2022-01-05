import {
  emitEvent,
  registerEvent,
  Log,
  deepScan,
  setProjectGlobal,
  updateStore,
} from '/bitburner-vue/lib.js'

export default class Orchestrator {
  logger

  #ns
  #scriptInfo
  #hostname
  #serverList
  #processList
  #nsCommandQueue

  /**
   * @param {NS} ns
   */
  constructor(ns) {
    ns.disableLog('ALL')
    ns.createProgram

    this.logger = new Log(ns)

    this.#ns = ns
    this.#scriptInfo = ns.getRunningScript()
    this.#hostname = this.#scriptInfo.server
    this.#serverList = new ServerList(ns, this)
    this.#processList = new ProcessList(ns, this)
    this.#nsCommandQueue = new NSCommandQueue(ns, this)

    setProjectGlobal('orchestrator', this)
  }

  async init() {
    registerEvent('nsCommand:request', this.queueNsCommand.bind(this))
    emitEvent('init:orchestrator', { hostname: this.#hostname })
    return this
  }

  async update() {
    updateStore({ scriptInfo: this.#ns.ps().map((pi) => this.#ns.getRunningScript(pi.pid)) })
    updateStore({ playerInfo: this.#ns.getPlayer() })
    updateStore({ homeInfo: this.#ns.getServer() })
    await this.#nsCommandQueue.update()
    await this.#processList.update()
    await this.#serverList.update()
  }

  queueNsCommand(event) {
    this.#nsCommandQueue.add(NSCommand.createFromEvent(this.#ns, event))
  }

  get scriptInfo() {
    return this.#scriptInfo
  }

  get hostname() {
    return this.#hostname
  }

  get serverList() {
    return this.#serverList
  }

  get processList() {
    return this.#processList
  }
}

class ServerList {
  #ns
  #orchestrator
  #hostnames

  constructor(ns, orchestrator) {
    this.#ns = ns
    this.#orchestrator = orchestrator
    this.hydrate()
  }

  hydrate() {
    this.#hostnames = deepScan(this.#ns)
  }

  async update() {
    this.hydrate()
  }

  get hostnames() {
    return this.#hostnames
  }
}

class ProcessList {
  #ns
  #orchestrator
  #processList

  /**
   * @param {NS} ns
   * @param {Orchestrator} orchestrator
   */
  constructor(ns, orchestrator) {
    this.#ns = ns
    this.#orchestrator = orchestrator
    this.#hydrate()
  }

  async #hydrate() {
    this.#processList = this.#ns.ps(this.#orchestrator.hostname)
  }

  async update() {
    await this.#hydrate()
  }

  get all() {
    return this.#processList
  }

  get allScriptInfo() {
    return this.#processList.map((processInfo) => {
      this.#ns.getRunningScript(processInfo.pid)
    })
  }
}

class NSCommandQueue {
  #ns
  #commands
  #commandHistory
  orchestrator

  /**
   * @param {NS} ns
   * @param {Orchestrator} orchestrator
   */
  constructor(ns, orchestrator) {
    this.#ns = ns
    this.orchestrator = orchestrator
    this.#commands = [] // May need to use Map or Set, idk yet
    this.#commandHistory = []
  }

  async update() {
    let nsCommand = this.next()
    if (!nsCommand) return

    emitEvent('nsCommand:started', nsCommand.reportMinimal)
    await nsCommand.execute()
    this.remove(nsCommand)

    // Alternative looping strat: handle all commands each update
    /*
    while (nsCommand) {
      ...
      nsCommand = this.next()
    }
    */
  }

  /**
   * @param {NSCommand} nsCommand
   */
  add(nsCommand) {
    nsCommand.owner = this
    this.#commands.push(nsCommand)
    emitEvent('nsCommand:queued', nsCommand.reportMinimal)
  }

  /**
   * @returns {NSCommand} nsCommand
   */
  next() {
    return this.#commands[0]
  }

  /**
   * @param {NSCommand} nsCommand
   */
  remove(nsCommand) {
    this.#commandHistory.push(nsCommand)
    this.#commands = this.#commands.filter((cmd) => cmd.uuid !== nsCommand.uuid)
  }
}

class NSCommand {
  #ns
  #nsCommandQueue
  #uuid

  #commandFn
  #notifyFn
  #successFn
  #failFn
  #alwaysFn

  #isRunning
  #didSucceed
  #successValue
  #didFail
  #failValue

  static createFromEvent(ns, event) {
    return new NSCommand(
      ns,
      event.commandFn,
      event.notifyFn,
      event.successFn,
      event.failFn,
      event.alwaysFn,
      event.uuid
    )
  }

  static commandFnAsString(commandFn) {
    if (!commandFn) return
    try {
      return String(commandFn)
        .split('\n')
        .map((line) => line.trim())
        .join(' ↩ ')
    } catch {
      return '[Function; could not stringify]'
    }
  }

  constructor(ns, commandFn, notifyFn, successFn, failFn, alwaysFn, uuid) {
    this.#ns = ns
    this.#uuid = uuid || crypto.randomUUID()

    this.#commandFn = commandFn || (() => {})
    this.#notifyFn = notifyFn || (() => {})
    this.#successFn = successFn || (() => {})
    this.#failFn = failFn || (() => {})
    this.#alwaysFn = alwaysFn || (() => {})

    this.#isRunning = false
    this.#didSucceed = null
    this.#successValue = null
    this.#didFail = null
    this.#failValue = null
  }

  async execute() {
    try {
      this.markRunning()
      let result = await this.#commandFn(this.#ns)
      this.markFinished()
      this.markSuccess(result)
    } catch (error) {
      console.error(error)
      this.markFinished()
      this.markFail(error)
    } finally {
      this.#alwaysFn(this)
    }
  }

  toString() {
    return this.report
  }

  notify() {
    this.#notifyFn(this)
  }

  markRunning() {
    this.#isRunning = true
    this.notify()
  }

  markFinished() {
    this.#isRunning = false
    this.notify()
  }

  markFail(failValue) {
    this.#didFail = true
    this.#failValue = failValue.toString()
    this.#didSucceed = false
    this.notify()
    this.#failFn(this)
    emitEvent('nsCommand:fail', this.report)
  }

  markSuccess(successValue) {
    this.#didSucceed = true
    this.#successValue = successValue
    this.#didFail = false
    this.notify()
    this.#successFn(this)
    emitEvent('nsCommand:success', this.report)
  }

  get ns() {
    return this.#ns
  }

  get nsCommandQueue() {
    return this.#nsCommandQueue
  }

  get uuid() {
    return this.#uuid
  }

  get report() {
    return {
      uuid: this.#uuid,
      isRunning: this.#isRunning,
      didSucceed: this.#didSucceed,
      successValue: this.#successValue,
      didFail: this.#didFail,
      failValue: this.#failValue,
      commandFn: NSCommand.commandFnAsString(this.#commandFn),
    }
  }

  get reportMinimal() {
    return {
      uuid: this.#uuid,
      commandFn: NSCommand.commandFnAsString(this.#commandFn),
    }
  }

  set owner(val) {
    this.#nsCommandQueue = val
  }
}
