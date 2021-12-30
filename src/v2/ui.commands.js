import { emitEvent, setAppVisible, updateStore, projectGlobals } from '/v2/lib.js'

export const RebootApplication = {
  name: `🔁 Reboot Application`,
  slug: 'reboot-application',
  executeFn: (commandReport, vueCmp) => {
    emitEvent('nsCommand:request', {
      uuid: commandReport.uuid,
      commandFn: async (ns) => {
        // Hide the global app UI for smooth reload vibes; pause for anims
        setAppVisible(false)
        await ns.asleep(500)

        // Find current execution meta
        let rs = ns.getRunningScript()
        let oldPid = projectGlobals.orchestrator.scriptInfo.pid

        // Run the new script with a random UUID to allow for multiple instances to coexist briefly
        let newPid = ns.run(rs.filename, rs.threads, crypto.randomUUID())

        // Kill current (now "old") script
        ns.kill(oldPid)

        return `Rebooted ${rs.filename} (old PID: ${oldPid}, new PID: ${newPid})`
      },
      notifyFn: async (nsCommand) => {
        commandReport.state = nsCommand.report
      },
      successFn: async (nsCommand) => {
        // Update UI state of newly booted app to re-open dashboard
        setTimeout(() => {
          updateStore({ uiState: { isAppOpen: true } })
        }, 1000)
      },
      failFn: async (nsCommand) => {},
      alwaysFn: async (nsCommand) => {},
    })
  },
}

export const TestCommandFast = {
  name: `Test Command (Fast)`,
  slug: 'test-command-fast',
  executeFn: (commandReport, vueCmp) => {
    emitEvent('nsCommand:request', {
      uuid: commandReport.uuid,
      commandFn: async (ns) => {
        return await ns.ps()
      },
      notifyFn: async (nsCommand) => {
        commandReport.state = nsCommand.report
      },
      successFn: async (nsCommand) => {},
      failFn: async (nsCommand) => {},
      alwaysFn: async (nsCommand) => {},
    })
  },
}

export const TestCommandSlow = {
  name: `Test Command (Slow)`,
  slug: 'test-command-slow',
  executeFn: (commandReport, vueCmp) => {
    emitEvent('nsCommand:request', {
      uuid: commandReport.uuid,
      commandFn: async (ns) => {
        return await ns.sleep(6000)
      },
      notifyFn: async (nsCommand) => {
        commandReport.state = nsCommand.report
      },
      successFn: async (nsCommand) => {},
      failFn: async (nsCommand) => {},
      alwaysFn: async (nsCommand) => {},
    })
  },
}

export const TestCommandFail = {
  name: `Test Command (Fail)`,
  slug: 'test-command-fail',
  executeFn: (commandReport, vueCmp) => {
    emitEvent('nsCommand:request', {
      uuid: commandReport.uuid,
      commandFn: async (ns) => {
        await ns.sleep(1000)
        throw new Error(`I've fallen and I can't get up!`)
      },
      notifyFn: async (nsCommand) => {
        commandReport.state = nsCommand.report
      },
      successFn: async (nsCommand) => {},
      failFn: async (nsCommand) => {},
      alwaysFn: async (nsCommand) => {},
    })
  },
}
