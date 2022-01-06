export const WindowStates = Object.freeze({
  open: 'open',
  closed: 'closed',
})

export const WindowPositionStrategies = Object.freeze({
  cascadeStack: 'cascadeStack',
})

export const AppStates = Object.freeze({
  hasWindows: 'hasWindows',
  withoutWindows: 'withoutWindows',
})

export const TrayItemTypes = Object.freeze({
  windowMount: 'windowMount',
  consumerRootMount: 'consumerRootMount',
})

export const ComponentTiers = Object.freeze({
  library: 'library',
  consumer: 'consumer',
})

export function nearestConsumerRootMount(startingVm) {
  let consumerRoot = null
  let parent = startingVm.$parent
  while (parent && !consumerRoot) {
    if (parent.$options.__consumerRoot === true) {
      consumerRoot = parent
    }
    parent = parent.$parent
  }
  return consumerRoot
}
