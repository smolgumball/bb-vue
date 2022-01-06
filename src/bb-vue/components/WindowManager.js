import { WindowPositionStrategies } from '/bb-vue/components/_resources.js'

export default {
  name: 'bbv-window-manager',
  inject: ['internals'],
  template: `<!-- __CMP_NAME__ -->`,
  created() {
    this.internals.listen('window:updated', this.onWindowUpdated)
  },
  methods: {
    onWindowUpdated({ action, windowMount }) {
      switch (action) {
        case 'created':
          this.onWindowCreated(windowMount)
          break
        case 'destroyed':
          this.onWindowDestroyed(windowMount)
          break
      }
    },
    onWindowCreated(windowMount) {
      this.internals.store.windowMounts.push(windowMount)
      if (this.internals.store.windowMounts.length > 1) {
        this.placeWindow(windowMount, WindowPositionStrategies.cascadeStack)
      }
    },
    onWindowDestroyed(windowMount) {
      this.internals.store.windowMounts = this.internals.store.windowMounts.filter((x) => {
        return x.uuid != windowMount.uuid
      })
    },
    placeWindow(windowMount, positionStrategy) {
      switch (positionStrategy) {
        case WindowPositionStrategies.cascadeStack:
          // TODO
          break

        default:
          break
      }
    },
  },
}
