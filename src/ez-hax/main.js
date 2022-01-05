import { Log, emit } from '/lib/utils.js'

// Config
// ---

const mainHackFilename = '4everweak.js'
const libFilename = '/lib/utils.js'

/**
 * Reserve RAM on host for other scripts
 */
const homeReservedRam = 35 // GB

/**
 * Prevent scans that are too deep or too extensive (lockup-prevention)
 */
const scanLimit = 200

/**
 * When dispatching attacks, ignore servers that don't have at least this much money
 */
const million = 1e6
const billion = 1e9
const moneyMin = million

/** @param {NS} ns **/
export async function main(ns) {
  let log = Log.init(ns)

  ns.ps('home').forEach((proc) => {
    if (proc.filename == mainHackFilename) ns.kill(proc.pid, 'home')
  })

  let prepWatchdog = 1
  let visitHistory = {}
  let visitQueue = await prep(ns, 'home', mainHackFilename, libFilename)

  /**
   * Run deep prep on as many servers as our skills allow
   */
  while (Object.keys(visitQueue).length) {
    if (prepWatchdog >= scanLimit) {
      log.error(`Halting deep scan - iteration limit reached`)
      break
    }

    for (const hostname in visitQueue) {
      prepWatchdog++

      // Skip processed servers
      if (visitHistory[hostname]) {
        delete visitQueue[hostname]
        continue
      }

      // Save breadcrumb of visitation
      let serverObj = visitQueue[hostname]
      visitHistory[hostname] = serverObj

      // Carry out deep prep
      let prepResults = await prep(ns, hostname, mainHackFilename, libFilename)

      // Merge discovered servers into queue
      visitQueue = { ...visitQueue, ...prepResults }

      // Pop hostname off queue
      delete visitQueue[hostname]
    }
  }

  for (const hostname in visitHistory) {
    if (hostname !== 'home') {
      ns.killall(hostname)
    }
  }

  /**
   * Report on highest earners
   */
  let lowestWeakTimeServers = []
  for (const hostname in visitHistory) {
    let serverData = visitHistory[hostname]
    if (!serverData.hasAdminRights || !serverData.canHack) continue
    lowestWeakTimeServers.push({
      ...serverData.meta.data,
      weakTime: ns.getWeakenTime(hostname),
    })
  }
  lowestWeakTimeServers.sort((a, b) => {
    if (a.weakTime < b.weakTime) {
      return -1
    }
    if (a.weakTime > b.weakTime) {
      return 1
    }
    return 0
  })

  log.info(`Top 5 Weak Servers:`)
  log.info(
    log.toJson(
      lowestWeakTimeServers.slice(0, 5).map((x) => {
        return { hostname: x.hostname, weakTime: `${x.weakTime / 1000}s` }
      })
    )
  )

  /**
   * Report on strongest workers
   */
  let strongestWorkerServers = []
  for (const hostname in visitHistory) {
    let serverData = visitHistory[hostname]
    let serverMeta = serverData.meta.data
    if (!serverData.hasAdminRights) continue

    if (serverMeta.maxRam >= ns.getScriptRam(mainHackFilename)) {
      strongestWorkerServers.push(serverMeta)
    }
  }
  strongestWorkerServers.sort((a, b) => {
    if (a.maxRam > b.maxRam) {
      return -1
    }
    if (a.maxRam < b.maxRam) {
      return 1
    }
    return 0
  })

  log.info(`Top 5 Worker Servers:`)
  log.info(
    log.toJson(
      strongestWorkerServers.slice(0, 5).map((x) => {
        return { hostname: x.hostname, maxRam: `${x.maxRam}GB` }
      })
    )
  )

  /**
   * Execute automated attacks based on earning / working data
   */

  const initWeakTimeServers = () => [lowestWeakTimeServers[0]]
  const initStrongestWorkerServers = () => [...strongestWorkerServers]
  let ezWeakServers = initWeakTimeServers()
  let bigBoiServers = initStrongestWorkerServers()
  let saturatedServers = new Set()
  let targetServer = null
  let hostServer = null
  let targetCount = ezWeakServers.length
  let hostCount = 0
  let hostsWrapped = false
  let assignmentWatchdog = 0
  let totalThreadsSpawned = 0

  while (saturatedServers.size != strongestWorkerServers.length && ++assignmentWatchdog < 2000) {
    targetServer = { hostname: 'joesguns' } // Jut use joesguns, who cares
    hostServer = bigBoiServers.shift()
    if (!hostsWrapped) hostCount++

    if (!hostServer) {
      bigBoiServers = initStrongestWorkerServers()
      hostsWrapped = true
      continue
    }

    let attackRam = ns.getScriptRam(mainHackFilename)
    let maxRam = ns.getServerMaxRam(hostServer.hostname)
    let ramUsed = ns.getServerUsedRam(hostServer.hostname)
    let availRam = maxRam - ramUsed

    let availRamForNewAttack = hostServer.hostname == 'home' ? availRam - homeReservedRam : availRam
    // let availRamForNewAttack = availRam * 0.1 >= attackRam ? availRam * 0.1 : availRam
    let isHomeFull = hostServer.hostname == 'home' && availRam <= homeReservedRam
    let isServerFull = availRamForNewAttack < attackRam

    if ((isHomeFull || isServerFull) && !saturatedServers.has(hostServer.hostname)) {
      saturatedServers.add(hostServer.hostname)
      ns.print(
        `INFO: ${hostServer.hostname} is saturated after ${assignmentWatchdog} assignment iterations`
      )
      continue
    } else if (saturatedServers.has(hostServer.hostname)) {
      continue
    }

    let threadCount = Math.floor(availRamForNewAttack / attackRam)
    if (threadCount < 1) {
      ns.print(`ERROR: Not enough RAM for execution ${execArgs.join(' • ')}`)
      return
    }

    let scriptArgs = [targetServer.hostname, crypto.randomUUID()]
    let execArgs = [mainHackFilename, hostServer.hostname, threadCount, ...scriptArgs]
    let newPid = ns.exec(...execArgs)
    totalThreadsSpawned += threadCount

    ns.print(`Dispatched new attack (PID: ${newPid}): ${execArgs.join(' • ')}`)
  }

  hostCount--

  /**
   * Build report
   */

  let ezReport = {
    totalServers: Object.keys(visitHistory).length,
    rootedServers: null,
    hackableServers: null,
    numRooted: null,
    numHackable: null,
    totalRam: null,
  }

  ezReport.rootedServers = Object.entries(visitHistory).filter(
    ([key, server]) => server.hasAdminRights
  )
  ezReport.numRooted = ezReport.rootedServers.length

  ezReport.hackableServers = Object.entries(visitHistory).filter(([key, server]) => server.canHack)
  ezReport.numHackable = ezReport.hackableServers.length

  ezReport.totalRam = ezReport.rootedServers.reduce((acc, [key, server]) => {
    if (server.meta.data.maxRam >= ns.getScriptRam(mainHackFilename)) {
      return acc + server.meta.data.maxRam
    } else {
      return acc
    }
  }, 0)

  log.info(`

🤖 sup

- took ${prepWatchdog} / ${scanLimit} prep iterations
- found ${ezReport.totalServers} servers in network
- rooted: ${ezReport.numRooted} / ${ezReport.totalServers}
- hackable: ${ezReport.numHackable} / ${ezReport.totalServers}
- collective ram: ${ezReport.totalRam}GB

🔥 hax

- took ${assignmentWatchdog} assignment iterations
- spawned: ${totalThreadsSpawned} threads
- workers: ${hostCount} / ${strongestWorkerServers.length}
- targets: ${targetCount} / ${ezReport.numHackable}

`)
}

/** @param {NS} ns **/
export async function prep(ns, primaryHost, mainHackFilename, libFilename) {
  let log = Log.init(ns, { silence: true })
  let servers = ns.scan(primaryHost)
  let report = {}

  log.info(`Scanning ${primaryHost}... neighboring servers found:\n${log.toJson(servers)}`)

  if (!ns.fileExists(libFilename, 'home')) {
    log.error(`${libFilename} is missing on 'home'`)
    ns.exit()
  }

  if (!ns.fileExists(mainHackFilename, 'home')) {
    log.error(`${mainHackFilename} is missing on 'home'`)
    ns.exit()
  }

  for (var targetHostname of servers) {
    report[targetHostname] = {
      hasAdminRights: false,
      canHack: false,
      meta: {
        errorMessage: '',
        data: {},
      },
    }
    let reportObj = report[targetHostname]
    let serverData = ns.getServer(targetHostname)

    log.info(`⚡ Started working on ${targetHostname}`)

    /**
     * Check for root access
     */
    if (serverData.hasAdminRights) {
      log.info(`✅ Root access present for ${targetHostname}`)
    } else {
      log.info(`Root access not found for ${targetHostname}`)
      log.info(`Attempting to nuke() ${targetHostname}`)

      /**
       * Check for port requirements
       */
      let portOpeners = {
        brutessh: {
          tech: 'ssh',
          available: ns.fileExists('BruteSSH.exe', 'home'),
          needed: false,
        },
        ftpcrack: {
          tech: 'ftp',
          available: ns.fileExists('FTPCrack.exe', 'home'),
          needed: false,
        },
        relaysmtp: {
          tech: 'smtp',
          available: ns.fileExists('relaySMTP.exe', 'home'),
          needed: false,
        },
        sqlinject: {
          tech: 'sql',
          available: ns.fileExists('SQLInject.exe', 'home'),
          needed: false,
        },
        httpworm: {
          tech: 'http',
          available: ns.fileExists('HTTPWorm.exe', 'home'),
          needed: false,
        },
      }

      let toolsMissing = []
      for (const crackVector in portOpeners) {
        let crackData = portOpeners[crackVector]
        crackData.needed = !serverData[`${crackData.tech}PortOpen`]
        if (crackData.needed) {
          if (crackData.available) {
            log.info(`Cracking ${crackData.tech} port on ${targetHostname}`)
            ns[crackVector](targetHostname)
          } else {
            toolsMissing.push(crackVector)
          }
        }
      }

      // Refresh server data
      serverData = ns.getServer(targetHostname)

      let canProgressHack = serverData.openPortCount >= serverData.numOpenPortsRequired
      if (!canProgressHack) {
        reportObj.meta.errorMessage = `Only cracked ${serverData.openPortCount} of ${
          serverData.numOpenPortsRequired
        } ports - missing cracking tools on 'home' device: ${toolsMissing.join(', ')}`
        reportObj.meta.data = serverData
        continue
      }

      // Attempt nuke + refresh serverData
      ns.nuke(targetHostname)
      serverData = ns.getServer(targetHostname)

      if (serverData.hasAdminRights) {
        log.info(`✅ Root access granted for ${targetHostname}!`)
      } else {
        reportObj.meta.errorMessage = `Root access not attained for ${targetHostname} - aborting. See server details: ${log.toJson(
          serverData
        )}`
        reportObj.meta.data = serverData
        continue
      }
    }

    // Earmark progress
    reportObj.hasAdminRights = true

    /**
     * Check hacking reqs
     */
    let currentHacking = ns.getHackingLevel()
    if (currentHacking < serverData.requiredHackingSkill) {
      reportObj.meta.errorMessage = `Need ${serverData.requiredHackingSkill} hacking skill for ${targetHostname} - only have ${currentHacking}`
      reportObj.meta.data = serverData
    } else {
      // Earmark progress
      reportObj.canHack = true
    }

    /**
     * Replicate hacks to server
     */
    let filesToCopy = [mainHackFilename, libFilename]
    await ns.scp(filesToCopy, 'home', targetHostname)
    log.info(`📂 Copied ${filesToCopy.join(', ')} from 'home' to ${targetHostname}`)

    /**
     * Save meta about server
     */
    serverData = ns.getServer(targetHostname)
    reportObj.meta.data = serverData

    /**
     * Completed prep
     */
    log.info(`🏁 Finished working on ${targetHostname}\n\n`)
  }

  log.info(`Prep completed on server tree originating at ${primaryHost}`)

  return report
}

/** @param {NS} ns **/
export async function attack(ns, hostname, targetHostname, mainHackFilename, threads, uuid) {
  /**
   * Trigger hack script
   */
  return ns.exec(mainHackFilename, hostname, threads, targetHostname, uuid)
}
