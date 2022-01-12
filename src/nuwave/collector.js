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

    if (tick % 1000 === 0) {
      data.player = this.player()
    }

    if (tick % 2000 === 0) {
      data.srv.hosts = this.allServers()
      data.srv.hackable = this.hackableServers()
      data.srv.rooted = this.rootedServers()
    }

    if (tick % 5000 === 0) {
      data.srv.details = this.serverDetails()
    }
  }

  player() {
    return this.ns.getPlayer()
  }

  hackableServers() {
    let ns = this.ns
    let data = this.store.data
    return data.srv.hosts.filter(
      (x) => ns.hasRootAccess(x) && data.player.hacking <= ns.getServerRequiredHackingLevel(x)
    )
  }

  rootedServers() {
    let ns = this.ns
    let data = this.store.data
    return data.srv.hosts.filter((x) => ns.hasRootAccess(x))
  }

  serverDetails() {
    let ns = this.ns
    let data = this.store.data
    let details = {}
    data.srv.hosts.forEach((x) => {
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
}
