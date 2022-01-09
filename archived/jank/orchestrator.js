import { Log, date, PortMap } from '/jank/lib.js'

const oneSecond = 1000
const oneMinute = oneSecond * 60

// Config
// ---

const hackFile = '/jank/remote/hack.js'
const growFile = '/jank/remote/grow.js'
const weakenFile = '/jank/remote/weaken.js'
const remoteFiles = [hackFile, growFile, weakenFile]

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
const billion = million * 1000
const moneyMin = million * 1 // billion * 250

/** @param {NS} ns **/
export async function main(ns) {
  let log = Log.init(ns)

  let i = 0
  let visitHistory = {}
  let visitQueue = await prep(ns, 'home', remoteFiles)

  /**
   * Run deep prep on as many servers as our skills allow
   */
  while (Object.keys(visitQueue).length) {
    if (i >= scanLimit) {
      log.error(`Halting deep scan - iteration limit reached`)
      break
    }

    for (const hostname in visitQueue) {
      i++

      // Skip processed servers
      if (visitHistory[hostname]) {
        delete visitQueue[hostname]
        continue
      }

      // Save breadcrumb of visitation
      let serverObj = visitQueue[hostname]
      visitHistory[hostname] = serverObj

      // Carry out deep prep
      let prepResults = await prep(ns, hostname, remoteFiles)

      // Merge discovered servers into queue
      visitQueue = { ...visitQueue, ...prepResults }

      // Pop hostname off queue
      delete visitQueue[hostname]
    }
  }

  /**
   * Require at least this much skill gap between the minimum hacking skill
   * for a given server vs. the players current hacking skill. Easier hacks
   * speed up hack / grow / weaken executions which can sometimes be more
   * profitable than hacks where the skill gap is narrow
   */
  let currentHackingLevel = ns.getHackingLevel()
  const minHackingSkillGap = Math.floor(currentHackingLevel < 300 ? 0 : currentHackingLevel * 0.1)

  const hackCost = ns.getScriptRam(hackFile)
  const growCost = ns.getScriptRam(growFile)
  const weakenCost = ns.getScriptRam(weakenFile)
  const remoteScriptRam = Math.max(hackCost, growCost, weakenCost)

  ns.ps('home').forEach((proc) => {
    if (remoteFiles.includes(proc.filename)) ns.kill(proc.pid, 'home')
  })

  for (const hostname in visitHistory) {
    if (hostname !== 'home') {
      ns.killall(hostname)
    }
  }

  /**
   * Report on highest earners
   */
  let highestMaxMoneyServers = []
  for (const hostname in visitHistory) {
    let serverData = visitHistory[hostname]
    if (!serverData.hasAdminRights || !serverData.canHack || hostname == 'home') continue

    let serverMeta = serverData.meta.data
    serverMeta.hackingSkillGap = currentHackingLevel - serverMeta.requiredHackingSkill

    if (serverMeta.moneyMax >= moneyMin) {
      if (serverMeta.hackingSkillGap >= minHackingSkillGap) {
        highestMaxMoneyServers.push(serverMeta)
      }
    }
  }
  highestMaxMoneyServers.sort((a, b) => b.moneyMax - a.moneyMax)

  log.info(`Top 5 Money Servers:`)
  log.info(
    log.toJson(
      highestMaxMoneyServers.slice(0, 5).map((x) => {
        return {
          hostname: x.hostname,
          moneyMax: ns.nFormat(x.moneyMax, '$0.00a'),
          moneyAvailable: ns.nFormat(x.moneyAvailable, '$0.00a'),
          valueVsPotential: ns.nFormat(x.moneyAvailable / x.moneyMax, '0%'),
          easeOfSeverGrowth: `${x.serverGrowth}%`,
          hackingSkillGap: x.hackingSkillGap,
        }
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

    if (serverMeta.maxRam >= remoteScriptRam) {
      strongestWorkerServers.push(serverMeta)
    }
  }
  strongestWorkerServers.sort((a, b) => b.maxRam - a.maxRam)

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

  let exhaustedWorkers = new Set()
  let satisfiedHackTargets = new Set()
  let satisfiedGrowthTargets = new Set()
  let satisfiedWeakenTargets = new Set()
  let hackAllotments = {}
  let growAllotments = {}
  let weakenAllotments = {}
  let attackReports = []

  let longestTask = 0
  let longestDelay = 0
  let assignmentWatchdog = 0

  while (++assignmentWatchdog < 10000) {
    let targetServer = highestMaxMoneyServers.find(
      (srv) =>
        !(
          satisfiedHackTargets.has(srv.hostname) &&
          satisfiedGrowthTargets.has(srv.hostname) &&
          satisfiedWeakenTargets.has(srv.hostname)
        )
    )
    let workerServer = strongestWorkerServers.find((srv) => !exhaustedWorkers.has(srv.hostname))

    if (!targetServer) break
    if (!workerServer) break

    if (!hackAllotments[targetServer.hostname]) hackAllotments[targetServer.hostname] = 0
    if (!growAllotments[targetServer.hostname]) growAllotments[targetServer.hostname] = 0
    if (!weakenAllotments[targetServer.hostname]) weakenAllotments[targetServer.hostname] = 0

    const targetMaxMoney = ns.getServerMaxMoney(targetServer.hostname)
    const targetCurMoney = ns.getServerMoneyAvailable(targetServer.hostname)
    const targetGrowthEase = ns.getServerGrowth(targetServer.hostname) / 100
    const targetPercentFull = targetCurMoney / targetMaxMoney
    const targetGrowthNeed = targetMaxMoney / Math.max(targetCurMoney, 1)
    const targetMinSecurity = ns.getServerMinSecurityLevel(targetServer.hostname)
    const targetCurSecurity = ns.getServerSecurityLevel(targetServer.hostname)
    const targetPercentWeak = targetMinSecurity / targetCurSecurity
    const workerCores = workerServer.cpuCores

    const hackAnalyze = ns.hackAnalyze(targetServer.hostname)
    const weakenAnalyze = ns.weakenAnalyze(1, workerCores)
    const growAnalyze = ns.growthAnalyze(targetServer.hostname, targetGrowthNeed, workerCores)

    /**
     * Linear:
     *  entirely based on server fullness
     */
    let hackNeed = targetPercentFull >= 0.95 ? 1 : 0
    const hackThreadsMax = Math.max(Math.floor(0.5 / hackAnalyze), 1)
    if (satisfiedHackTargets.has(targetServer.hostname)) hackNeed = 0

    /**
     * Weighted:
     *  one half based on current server emptiness
     *  one half based on ease of growth
     */
    let growNeed = targetPercentFull < 0.95 ? 1 : 0.2
    const growThreadsMax = Math.max(Math.floor(growAnalyze), 1)
    if (satisfiedGrowthTargets.has(targetServer.hostname)) growNeed = 0

    /**
     * Weighted:
     *  one half based on current security percentage
     *  one half based on need for growth
     */
    let weakenNeed = targetPercentWeak < 0.95 ? 1 : 0.2
    const weakenThreadsMax = Math.max(
      Math.floor((targetCurSecurity - targetMinSecurity) / weakenAnalyze),
      1
    )
    if (satisfiedWeakenTargets.has(targetServer.hostname)) weakenNeed = 0

    // Calc thread availability
    // ---

    const isHome = workerServer.hostname == 'home'
    const maxRam = ns.getServerMaxRam(workerServer.hostname)
    const ramUsed = ns.getServerUsedRam(workerServer.hostname)
    const availRam = maxRam - ramUsed

    let reservedRam = 0
    if (isHome) reservedRam = homeReservedRam
    let availRamScaled = availRam /* * 0.33 */ /* Only allocate some of total RAM at a time */

    const possibleThreads = Math.floor(
      (availRamScaled < remoteScriptRam ? availRam : availRamScaled - reservedRam) / remoteScriptRam
    )
    if (possibleThreads < 1) {
      exhaustedWorkers.add(workerServer.hostname)
      continue
    }

    let hackThreadsAvailable = Math.floor(possibleThreads * 0.33)
    let growThreadsAvailable = Math.floor(possibleThreads * 0.33)
    let weakenThreadsAvailable = Math.floor(possibleThreads * 0.33)

    // Hack threads assignment
    // ---

    const hackThreads = Math.min(Math.floor(hackThreadsAvailable * hackNeed), hackThreadsMax)
    const willHack = hackThreads > 2
    hackAllotments[targetServer.hostname] += hackThreads
    if (hackAllotments[targetServer.hostname] >= hackThreadsMax || hackNeed == 0 || !willHack) {
      satisfiedHackTargets.add(targetServer.hostname)
    }

    // Grow threads assignment
    // ---

    const growThreads = Math.min(Math.floor(growThreadsAvailable * growNeed), growThreadsMax)
    const willGrow = growThreads > 2
    growAllotments[targetServer.hostname] += growThreads
    if (growAllotments[targetServer.hostname] >= growThreadsMax || growNeed == 0 || !willGrow) {
      satisfiedGrowthTargets.add(targetServer.hostname)
    }

    // Weaken threads assignment
    // ---

    const weakenThreads = Math.min(
      Math.floor(weakenThreadsAvailable * weakenNeed),
      weakenThreadsMax
    )
    const willWeaken = weakenThreads > 2
    weakenAllotments[targetServer.hostname] += weakenThreads
    if (
      weakenAllotments[targetServer.hostname] >= weakenThreadsMax ||
      weakenNeed == 0 ||
      !willWeaken
    ) {
      satisfiedWeakenTargets.add(targetServer.hostname)
    }

    // Check for worker exhaustion
    // ---

    if ([hackThreads, growThreads, weakenThreads].every((n) => n == 0)) {
      exhaustedWorkers.add(workerServer.hostname)
      continue
    }

    const hackTime = !willHack ? 0 : ns.getHackTime(targetServer.hostname)
    const growTime = !willGrow ? 0 : ns.getGrowTime(targetServer.hostname)
    const weakenTime = !willWeaken ? 0 : ns.getWeakenTime(targetServer.hostname)

    new Array(hackTime, growTime, weakenTime).forEach(
      (lt) => (longestTask = lt > longestTask ? lt : longestTask)
    )

    const hackDelay = Math.max(growTime, weakenTime) + oneSecond * 10
    const growDelay = 0
    const weakenDelay = 0
    const hackLoopDelay = -1
    const growLoopDelay = 0
    const weakenLoopDelay = 0

    new Array(hackDelay, growDelay, weakenDelay).forEach(
      (ld) => (longestDelay = ld > longestDelay ? ld : longestDelay)
    )

    const attackUuid = crypto.randomUUID()

    // Launch hack
    let hackArgs = [
      /* worker */ workerServer.hostname,
      /* target */ targetServer.hostname,
      /* initialDelay */ hackDelay,
      /* loopDelay */ hackLoopDelay,
      /* uuid */ crypto.randomUUID(),
    ]
    let hackPid
    if (willHack) {
      hackPid = ns.exec(hackFile, workerServer.hostname, hackThreads, ...hackArgs)
    }

    // Launch grow
    let growArgs = [
      /* worker */ workerServer.hostname,
      /* target */ targetServer.hostname,
      /* initialDelay */ growDelay,
      /* loopDelay */ growLoopDelay,
      /* uuid */ crypto.randomUUID(),
    ]
    let growPid
    if (willGrow) {
      growPid = ns.exec(growFile, workerServer.hostname, growThreads, ...growArgs)
    }

    // Launch weaken
    let weakenArgs = [
      /* worker */ workerServer.hostname,
      /* target */ targetServer.hostname,
      /* initialDelay */ weakenDelay,
      /* loopDelay */ weakenLoopDelay,
      /* uuid */ crypto.randomUUID(),
    ]
    let weakenPid
    if (willWeaken) {
      weakenPid = ns.exec(weakenFile, workerServer.hostname, weakenThreads, ...weakenArgs)
    }

    const reportAllotments = (allotments) => {
      return Object.entries(allotments).sort((a, b) => b[1] - a[1])
    }

    // Report on attack
    attackReports.push({
      attackLane: `${workerServer.hostname} -> ${targetServer.hostname}`,
      attackNature: [
        `H: ${ns.nFormat(hackNeed, '0.00a')}`,
        `G: ${ns.nFormat(growNeed, '0.00a')}`,
        `W: ${ns.nFormat(weakenNeed, '0.00a')}}`,
      ].join(' / '),
      attackHost: workerServer.hostname,
      attackTarget: targetServer.hostname,
      attackUuid,
      serverReports: {
        exhaustedWorkers: Array.from(exhaustedWorkers),
        satisfiedHackTargets: Array.from(satisfiedHackTargets),
        satisfiedGrowthTargets: Array.from(satisfiedGrowthTargets),
        satisfiedWeakenTargets: Array.from(satisfiedWeakenTargets),
      },
      allotments: {
        hackAllotments: reportAllotments(hackAllotments),
        growAllotments: reportAllotments(growAllotments),
        weakenAllotments: reportAllotments(weakenAllotments),
      },
      pids: {
        hackPid,
        growPid,
        weakenPid,
      },
      threads: {
        hackThreads,
        growThreads,
        weakenThreads,
        possibleThreads,
        hackThreadsAvailable,
        growThreadsAvailable,
        weakenThreadsAvailable,
        hackThreadsMax,
        growThreadsMax,
        weakenThreadsMax,
      },
      outcomeAnalysis: {
        hackAnalyze,
        weakenAnalyze,
        growAnalyze,
      },
      targetState: {
        targetMaxMoney,
        targetCurMoney,
        targetGrowthEase,
        targetPercentFull,
        targetMinSecurity,
        targetCurSecurity,
        targetPercentWeak,
      },
      weights: {
        hackNeed,
        growNeed,
        weakenNeed,
      },
      timings: {
        hackTime,
        growTime,
        weakenTime,
        hackDelay,
        growDelay,
        weakenDelay,
        hackLoopDelay,
        growLoopDelay,
        weakenLoopDelay,
        hackTimeFriendly: date.timeDiff(Date.now(), Date.now() + hackTime),
        growTimeFriendly: date.timeDiff(Date.now(), Date.now() + growTime),
        weakenTimeFriendly: date.timeDiff(Date.now(), Date.now() + weakenTime),
        hackDelayFriendly: date.timeDiff(Date.now(), Date.now() + hackDelay),
        growDelayFriendly: date.timeDiff(Date.now(), Date.now() + growDelay),
        weakenDelayFriendly: date.timeDiff(Date.now(), Date.now() + weakenDelay),
      },
    })

    await ns.asleep(10)
  }

  const finalReport = {
    assignmentWatchdog,
    longestDelay,
    longestTask,
    longestDelayFriendly: date.timeDiff(Date.now(), Date.now() + longestDelay),
    longestTaskFriendly: date.timeDiff(Date.now(), Date.now() + longestTask),
    attackReports,
  }

  console.clear()
  console.log(finalReport)

  await ns.writePort(PortMap.orchestratorReport, JSON.stringify(finalReport))
}

/** @param {NS} ns **/
export async function prep(ns, primaryHost, remoteFiles) {
  let log = Log.init(ns, { silence: true })
  let servers = ns.scan(primaryHost)
  let report = {}

  log.info(`Scanning ${primaryHost}... neighboring servers found:\n${log.toJson(servers)}`)

  remoteFiles.forEach((file) => {
    if (!ns.fileExists(file, 'home')) {
      log.error(`${file} is missing on 'home'`)
      ns.exit()
    }
  })

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
    await ns.scp(remoteFiles, 'home', targetHostname)
    log.info(`📂 Copied ${remoteFiles.join(', ')} from 'home' to ${targetHostname}`)

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
