export const PortMap = {
  orchestratorReport: 1,
}

export function deepScan(ns) {
  const hostnames = ['home']
  for (const hostname of hostnames) {
    hostnames.push(...ns.scan(hostname).filter((host) => !hostnames.includes(host)))
  }

  return hostnames
}

export const emit = () => {}

export const date = {
  getRelativeTime(d1, d2 = new Date()) {
    d1 = +d1
    var units = {
      year: 24 * 60 * 60 * 1000 * 365,
      month: (24 * 60 * 60 * 1000 * 365) / 12,
      day: 24 * 60 * 60 * 1000,
      hour: 60 * 60 * 1000,
      minute: 60 * 1000,
      second: 1000,
    }

    var rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    var elapsed = d1 - d2

    // "Math.abs" accounts for both "past" & "future" scenarios
    for (var u in units)
      if (Math.abs(elapsed) > units[u] || u == 'second')
        return rtf.format(Math.round(elapsed / units[u]), u)
  },
  timeDiff(timeStart, timeEnd) {
    let diff = timeEnd - timeStart
    var hours = Math.floor(diff / (1000 * 60 * 60))
    diff -= hours * (1000 * 60 * 60)
    var mins = Math.floor(diff / (1000 * 60))
    diff -= mins * (1000 * 60)
    var secs = Math.floor(diff / 1000)
    diff -= secs * 1000
    var ms = Math.floor(diff)
    diff -= ms
    let toRet = []
    if (hours > 0) {
      toRet.push(`${hours}h`)
    }
    if (mins > 0) {
      toRet.push(`${mins}m`)
    }
    if (secs > 0) {
      toRet.push(`${secs}s`)
    }
    if (ms > 0 && !secs) {
      toRet.push(`${ms}ms`)
    }
    return toRet.join(' ')
  },
}

export const Log = {
  init(ns, opts = { silence: false }) {
    let instance = { ...this }
    instance.ns = ns
    instance.silence = opts.silence
    return instance
  },
  info(msg) {
    if (this.silence) return
    this.ns.tprint(`INFO: ${msg}`)
  },
  error(msg) {
    if (this.silence) return
    this.ns.tprint(`ERROR: ${msg}`)
  },
  toJson(val) {
    return JSON.stringify(val, null, '  ')
  },
}
