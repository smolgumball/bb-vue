import { getGlobal } from '/bb-vue/lib.js'

export default class Collector {
  ns
  store

  constructor(ns) {
    this.ns = ns
    this.store = getGlobal('nuMain.store')
  }

  async collect(tick) {
    let data = this.store.data

    if (tick % 5 === 0) {
      data.player = this.player()
    }

    if (tick % 5 === 0) {
      let serversMap = this.allServersMap()
      data.srv.serversTree = serversMap.tree
      data.srv.serversFlat = serversMap.flat
      // data.srv.hackable = this.hackableServers()
      // data.srv.rooted = this.rootedServers()
    }

    if (tick % 5 === 0) {
      data.srv.details = this.serverDetails()
    }
  }

  player() {
    return this.ns.getPlayer()
  }

  hackableServers() {
    let ns = this.ns
    let data = this.store.data
    return data.srv.serversFlat.filter(
      (x) => ns.hasRootAccess(x) && data.player.hacking <= ns.getServerRequiredHackingLevel(x)
    )
  }

  rootedServers() {
    let ns = this.ns
    let data = this.store.data
    return data.srv.serversFlat.filter((x) => ns.hasRootAccess(x))
  }

  serverDetails() {
    let ns = this.ns
    let data = this.store.data
    let details = {}
    data.srv.serversFlat.forEach((x) => {
      details[x] = ns.getServer(x)
    })
    return details
  }

  allServers() {
    const ns = this.ns
    const hostnames = ['home']
    for (const hostname of hostnames) {
      hostnames.push(...ns.scan(hostname).filter((host) => !hostnames.includes(host)))
    }
    return hostnames
  }

  allServersMap() {
    const ns = this.ns
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
}
