import { getGlobal, isBlank, toJson } from '/bb-vue/lib.js'

export default class Scheduler {
  ns
  store
  running = new Set()
  finished = new Set()
  failed = new Set()

  constructor(ns) {
    this.ns = ns
  }

  async init() {
    const bus = getGlobal('nuMain.bus')
    bus.on('nu:exec', this.handleExec.bind(this))
    bus.on('nu:exec:done', this.resolveExec.bind(this))
  }

  checkHealth(tick) {
    let ns = this.ns
    let data = getGlobal('nuMain.store.data')
    let { running, finished, failed } = this

    if (tick % 5000 === 0) {
      this.running.forEach((proc) => {
        if (!ns.getRunningScript(proc.pid)) {
          this.removeByUuid(this.running, proc.uuid)
        }
      })
      data.proc = {
        running,
        finished,
        failed,
      }
    }
  }

  handleExec({ script, host = 'home', threads = 1, args = [] }) {
    let ns = this.ns
    let uuid = crypto.randomUUID()
    let pid = ns.exec(script, host, threads, uuid, ...args)
    if (pid > 0) {
      this.running.add({ pid, uuid })
    } else {
      this.failed.add({ pid: null, uuid, error: 'Could not start' })
    }
  }

  resolveExec({ pid, uuid, result, error }) {
    if (!pid || !uuid || !isBlank(error)) {
      this.removeByUuid(this.running, uuid)
      this.failed.add({ pid, uuid, error })
    } else if (pid && uuid) {
      this.removeByUuid(this.running, uuid)
      this.finished.add({ pid, uuid, result })
    }
  }

  removeByUuid(set, uuid) {
    let toDel = this.findByUuid(set, uuid)
    if (toDel) set.delete(toDel)
    return set
  }

  findByUuid(set, uuid) {
    return Array.from(set).find((x) => x.uuid == uuid)
  }

  static async MakeChildScript(ns, scriptInfo, scriptFn) {
    const bus = getGlobal('nuMain.bus')
    const { pid, args } = scriptInfo
    const uuid = args[0]
    const done = (result) => {
      bus.emit('nu:exec:done', { pid, uuid, result })
    }
    try {
      await scriptFn(done)
    } catch (error) {
      bus.emit('nu:exec:done', { pid, uuid, error })
      ns.tprint(`ERROR: nuScheduler ChildScript failed 💔`)
      ns.tprint(`ERROR: ${toJson(error)}`)
      ns.exit()
    }
  }
}
