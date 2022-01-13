import { getGlobal, lodash, toJson } from '/bb-vue/lib.js'

export default class Scheduler {
  ns
  running = []
  finished = []
  failed = []
  queue = []

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
    let { queue, running, finished, failed } = this

    if (tick % 200 === 0) {
      this.running.forEach((proc) => {
        if (!ns.getRunningScript(proc.pid)) {
          this.removeByUuid(this.running, proc.uuid)
        }
      })
      data.proc = {
        queue,
        running,
        finished,
        failed,
      }
    }
  }

  queueAdd(data) {
    this.queue.push(data)
  }

  async execRun({ path, host = 'home', threads = 1, options = {}, args = [] } = {}) {
    let ns = this.ns
    ns.enableLog('ALL')
    let uuid = crypto.randomUUID()
    let pid = ns.exec(path, host, threads, uuid, toJson(options), ...args)
    await ns.sleep(10)
    if (pid > 0) {
      this.running.push({ pid, uuid })
    } else {
      this.failed.push({ pid, uuid, error: 'Could not start; PID was 0' })
    }
    ns.disableLog('ALL')
  }

  execResolve({ pid, uuid, result, error }) {
    if (pid && uuid && !error) {
      this.removeByUuid(this.running, uuid)
      this.finished.push({ pid, uuid, result })
    } else {
      this.removeByUuid(this.running, uuid)
      this.failed.push({ pid, uuid, error })
    }
  }

  removeByUuid(arr, uuid) {
    let toDel = this.findByUuid(arr, uuid)
    arr = lodash.without(toDel)
    return arr
  }

  findByUuid(arr, uuid) {
    return arr.find((x) => x.uuid == uuid)
  }

  static async MakeChildScript(ns, scriptInfo, scriptFn) {
    const bus = getGlobal('nuMain.bus')

    /**
     * @type {{
     *  pid: string,
     *  args: (string | number | boolean)[]>
     * }}
     **/
    const { pid, args } = scriptInfo
    const uuid = args[0]
    const argsJson = JSON.parse(args[1])
    const resolve = (result) => {
      bus.emit('nuScheduler:execResolve', { pid, uuid, result })
    }
    const reject = (error) => {
      bus.emit('nuScheduler:execResolve', { pid, uuid, error })
      ns.tprint(`ERROR: nuScheduler child process failed 💀`)
      ns.tprint(`ERROR: ${toJson(error)}`)
      ns.exit()
    }
    await scriptFn({
      uuid,
      resolve,
      reject,
      options: argsJson,
      argsRaw: args.slice(2),
      argsAll: args,
    })
  }
}
