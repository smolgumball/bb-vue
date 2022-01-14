import { getGlobal, lodash, toJson } from '/bb-vue/lib.js'

export default class Scheduler {
  ns
  running = []
  successful = []
  failed = []
  queue = []
  phantom = []

  /** @param { import("~/ns").NS } ns */
  constructor(ns) {
    this.ns = ns
  }

  async init() {
    const bus = getGlobal('nuMain.bus')
    bus.on('nuScheduler:add', this.queueAdd.bind(this) /* this.handleExec.bind(this) */)
    bus.on('nuScheduler:execResolve', this.execResolve.bind(this))
  }

  async runQueue(tick) {
    if (tick % 1000 === 0) {
      for (const queuedExec of this.queue) {
        if (getGlobal('nuMain').wantsShutdown) return
        await this.execRun(queuedExec)
        this.queue.shift()
      }
    }
  }

  async checkHealth(tick) {
    let ns = this.ns
    let data = getGlobal('nuMain.store').data

    if (tick % 200 === 0) {
      data.proc = {
        queue: this.queue,
        running: this.running,
        successful: this.successful,
        failed: this.failed,
        phantom: this.phantom,
      }
    }

    if (tick % 200 === 0) {
      this.running.forEach((proc, i) => {
        if (!ns.getRunningScript(proc.pid)) {
          this.running = this.removeByUuid(this.running, proc.uuid)
          this.phantom.push({ ...proc, timeEnd: Date.now() })
        } else {
          this.running[i].logs = this.gatherRunningLogs(proc)
        }
      })
    }
  }

  gatherRunningLogs(proc) {
    return this.filterLogs(this.ns.getRunningScript(proc.pid).logs)
  }

  filterLogs(logs = []) {
    return logs.filter((x) => !x.includes('Disabled logging'))
  }

  queueAdd(data) {
    this.queue.push({ ...data, timeQueued: Date.now() })
  }

  async execRun({ path, host = 'home', threads = 1, options = {}, args = [] } = {}) {
    let ns = this.ns
    let uuid = crypto.randomUUID()
    let pid = ns.exec(path, host, threads, uuid, toJson(options), ...args)
    if (pid > 0) {
      this.running.push({ path, host, threads, pid, uuid, logs: [], timeStart: Date.now() })
    } else {
      this.failed.push({
        path,
        host,
        threads,
        pid,
        uuid,
        logs: [],
        timeStart: Date.now(),
        error: 'Could not start; PID was 0',
      })
    }
    await ns.sleep(10)
  }

  execResolve({ uuid, logs, result, error }) {
    if (uuid && !error) {
      let proc = this.findByUuid(this.running, uuid)
      this.running = this.removeByUuid(this.running, uuid)
      this.successful.push({ ...proc, logs, result, timeEnd: Date.now() })
    } else {
      let proc = this.findByUuid(this.running, uuid) ?? this.findByUuid(this.phantom, uuid)
      this.running = this.removeByUuid(this.running, uuid)
      this.phantom = this.removeByUuid(this.phantom, uuid)
      this.failed.push({ ...proc, logs, error, timeEnd: Date.now() })
    }
  }

  removeByUuid(arr, uuid) {
    let toDel = this.findByUuid(arr, uuid)
    arr = lodash.without(arr, toDel)
    return arr
  }

  findByUuid(arr, uuid) {
    return arr.find((x) => x.uuid == uuid)
  }

  /** @param { import("~/ns").NS } ns */
  async child(ns, scriptFn) {
    ns.disableLog('sleep')
    const bus = getGlobal('nuMain.bus')

    /**
     * @type {{
     *  pid: string,
     *  args: (string | number | boolean)[]>
     * }}
     **/
    const uuid = ns.args[0]
    const argsJson = JSON.parse(ns.args[1])
    const resolve = async (result) => {
      bus.emit('nuScheduler:execResolve', {
        logs: this.filterLogs(ns.getScriptLogs()),
        uuid,
        result,
      })
    }
    const reject = async (error) => {
      bus.emit('nuScheduler:execResolve', {
        logs: this.filterLogs(ns.getScriptLogs()),
        uuid,
        error,
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
