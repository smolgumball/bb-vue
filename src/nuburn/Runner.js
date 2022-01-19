import { cleanupError, lodash, toJson } from '/bb-vue/lib.js'
import { nuEmit, nuListen } from '/nuburn/lib/globals.js'

export default class Runner {
  core
  running = []
  successful = []
  failed = []
  queue = []
  phantom = []

  constructor(core) {
    this.core = core
  }

  async init() {
    nuListen('nuRunner:add', this.queueAdd.bind(this))
    nuListen('nuRunner:doResolve', this.doResolve.bind(this))
  }

  async runQueue(tick) {
    if (tick % 1 === 0) {
      for (const queuedExec of this.queue) {
        if (this.core.wantsShutdown) return
        if (await this.doRun(queuedExec)) {
          this.queue.splice(this.queue.indexOf(queuedExec), 1)
        }
      }
    }
  }

  async syncStore(tick) {
    let data = this.core.store.data
    if (tick % 1 === 0) {
      data.proc = {
        queue: this.queue,
        running: this.running,
        successful: this.successful,
        failed: this.failed,
        phantom: this.phantom,
        all: [...this.queue, ...this.running, ...this.successful, ...this.failed, ...this.phantom],
      }
    }
  }

  async checkHealth(tick) {
    let ns = this.core.ns

    if (tick % 5 === 0) {
      this.running.forEach((proc, i) => {
        if (!ns.getRunningScript(proc.pid)) {
          ns.tprint(`nuCore.runner removing phantom:\n${toJson(proc)}`)
          this.removeByUuid(this.running, proc.uuid)
          this.phantom.push({ ...proc, timeEnd: Date.now() })
        } else {
          this.running[i].logs = this.gatherRunningLogs(proc)
        }
      })
    }
  }

  gatherRunningLogs(proc) {
    return this.filterLogs(this.core.ns.getRunningScript(proc.pid).logs)
  }

  filterLogs(logs = []) {
    return logs.filter((x) => !x.includes('Disabled logging'))
  }

  queueAdd(data) {
    this.queue.push({ ...data, uuid: crypto.randomUUID(), timeQueued: Date.now() })
  }

  async doRun({ path, uuid, host = 'home', threads = 1, options = {}, args = [] } = {}) {
    let ns = this.core.ns

    // RAM check
    let srv = ns.getServer(host)
    let freeRam = srv.maxRam - srv.ramUsed
    let cost = ns.getScriptRam(path) * threads
    if (cost > freeRam) return false // Notify queue to retry

    // Spawn
    let pid = ns.exec(path, host, threads, uuid, toJson(options), ...args)

    // Check validity
    if (pid > 0) {
      this.running.push({
        path,
        host,
        threads,
        pid,
        uuid,
        options,
        logs: [],
        timeStart: Date.now(),
      })
    } else {
      this.failed.push({
        path,
        host,
        threads,
        pid,
        uuid,
        options,
        logs: [],
        timeStart: Date.now(),
        error: 'Could not start; PID was 0',
      })
    }

    // Notify queue to shift
    return true
  }

  doResolve({ uuid, logs, result, error }) {
    if (uuid && (result || !error)) {
      let proc = this.findByUuid(this.running, uuid)
      this.removeByUuid(this.running, uuid)
      this.successful.push({ ...proc, logs, result, timeEnd: Date.now() })
    } else {
      let proc = this.findByUuid(this.running, uuid) ?? this.findByUuid(this.phantom, uuid)
      this.removeByUuid(this.running, uuid)
      this.removeByUuid(this.phantom, uuid)
      this.failed.push({ ...proc, logs, error, timeEnd: Date.now() })
    }
  }

  removeByUuid(arr, uuid) {
    arr.splice(arr.indexOf(this.findByUuid(arr, uuid)), 1)
  }

  findByUuid(arr, uuid) {
    return arr.find((x) => x.uuid == uuid)
  }

  /** @param { import("~/ns").NS } ns */
  async child(ns, scriptFn) {
    ns.disableLog('sleep')

    const uuid = ns.args[0]
    const argsJson = JSON.parse(ns.args[1])
    const resolve = async (result) => {
      nuEmit('nuRunner:doResolve', {
        logs: this.filterLogs(ns.getScriptLogs()),
        uuid,
        result,
      })
    }
    const reject = async (error) => {
      if (lodash.isString(error)) {
        error = cleanupError(error)
      }
      nuEmit('nuRunner:doResolve', {
        logs: this.filterLogs(ns.getScriptLogs()),
        uuid,
        error: error ?? ':: rejected without error ::',
      })
    }
    await scriptFn({
      uuid,
      resolve,
      reject,
      options: argsJson,
      argsRaw: ns.args.slice(2),
      argsAll: ns.args,
    })
  }
}
