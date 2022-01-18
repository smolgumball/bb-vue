import { getGlobal } from '/bb-vue/lib.js'

export function nuBus() {
  return getGlobal('nuCore').bus
}

export function nuListen() {
  return nuBus().on(...arguments)
}

export function nuEmit() {
  return nuBus().emit(...arguments)
}

export function nuShutdown() {
  return (getGlobal('nuCore').wantsShutdown = true)
}

export function nuStore() {
  return getGlobal('nuCore').store.data
}

export async function nuChild() {
  return getGlobal('nuCore').runner.child(...arguments)
}

export const ReplEvents = Object.freeze({
  runScript: 'runScript',
  reportScriptRun: 'reportScriptRun',
  doShutdown: 'doShutdown',
})

export const ReplStates = Object.freeze({
  staged: 'staged',
  running: 'running',
  succeeded: 'succeeded',
  killed: 'killed',
  failed: 'failed',
})
