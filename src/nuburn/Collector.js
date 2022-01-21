import { ScriptStates } from '/nuburn/lib/globals.js'

export default class Collector {
  core

  constructor(core) {
    this.core = core
  }

  async collect(tick) {
    const runEveryNumTicks = (rate) => tick <= 1 || tick % rate === 0
    const data = this.core.store.data

    if (runEveryNumTicks(50)) {
      let serversMap = this.allServersMap()
      data.srv.serversTree = serversMap.tree
      data.srv.serversFlat = serversMap.flat
    }

    if (runEveryNumTicks(10)) {
      data.srv.details = this.serverDetails()
    }

    if (runEveryNumTicks(10)) {
      data.player = this.player()
    }

    if (runEveryNumTicks(1)) {
      data.scripts = this.scripts()
    }
  }

  player() {
    return this.core.ns.getPlayer()
  }

  hackableServers() {
    let ns = this.core.ns
    let data = this.core.store.data
    return data.srv.serversFlat.filter(
      (x) => ns.hasRootAccess(x) && data.player.hacking <= ns.getServerRequiredHackingLevel(x)
    )
  }

  rootedServers() {
    let ns = this.core.ns
    let data = this.core.store.data
    return data.srv.serversFlat.filter((x) => ns.hasRootAccess(x))
  }

  serverDetails() {
    let ns = this.core.ns
    let data = this.core.store.data
    let details = {}
    data.srv.serversFlat.forEach((x) => {
      details[x] = ns.getServer(x)
    })
    return details
  }

  allServersMap() {
    const ns = this.core.ns
    const tree = { home: {} }
    const flat = new Set()

    doScan(tree.home, 'home')
    return { tree, flat: Array.from(flat) }

    function doScan(tree, hostname, depth = 0) {
      flat.add(hostname)
      const nodes = ns.scan(hostname).filter((x) => x !== hostname)
      nodes
        .filter((x) => flat.has(x) === false)
        .forEach((node) => {
          if (!tree.to) tree.to = {}
          tree.depth = depth
          tree.to[node] = {}
          doScan(tree.to[node], node, depth + 1)
        })
    }
  }

  scripts() {
    const maxScriptsKilledSize = 100
    const ns = this.core.ns
    const data = this.core.store.data
    let scriptsKilled = data.scripts.killed
    let _scriptsTransient = data.scripts._transient

    // TODO: Allow this to be configured via UI in EyeScriptsList
    const ignoreCondition = (rs) =>
      ['hack-target.js', 'grow-target.js', 'weak-target.js'].some((x) => rs.filename.includes(x))

    // Search all hostnames for runningScripts
    let scriptsActiveByPid = {}
    data.srv.serversFlat.forEach((hostname) => {
      ns.ps(hostname).map((proc) => {
        let runningScript = { ...ns.getRunningScript(proc.pid), status: ScriptStates.running }
        if (ignoreCondition(runningScript)) return

        // Add to log of current scripts
        scriptsActiveByPid[proc.pid] = runningScript
      })
    })

    _scriptsTransient = { ..._scriptsTransient, ...scriptsActiveByPid }

    // Mark killed any scripts in _scriptsTransient that have died since being added.
    // Ignores "now" scripts that were gathered this iteration
    Object.keys(_scriptsTransient)
      .filter(
        /* Reject scripts that are known running, or have already been marked killed */
        (pid) => !scriptsActiveByPid[pid] && !scriptsKilled.find((x) => x.pid == pid)
      )
      .forEach((pid) => {
        if (!ns.isRunning(pid)) {
          _scriptsTransient[pid].status = ScriptStates.killed
          scriptsKilled.unshift({ ..._scriptsTransient[pid], diedOn: Date.now() })
          delete _scriptsTransient[pid]
        }
      })

    if (scriptsKilled.length > maxScriptsKilledSize) {
      scriptsKilled = scriptsKilled.slice(0, maxScriptsKilledSize)
    }

    return {
      killed: scriptsKilled,
      activeByPid: scriptsActiveByPid,
      _transient: _scriptsTransient,
    }
  }
}
