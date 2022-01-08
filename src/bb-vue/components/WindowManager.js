export default {
  name: 'bbv-window-manager',
  inject: ['internals'],
  template: `<!-- __CMP_NAME__ -->`,
  data() {
    return {
      baseStackingIndex: 1510,
    }
  },
  computed: {},
  created() {
    this.internals.windowManager = this
  },
  methods: {
    addWindow(windowMount) {
      this.internals.store.windowMounts.push(windowMount)
    },
    removeWindow(windowMount) {
      this.internals.store.windowMounts = this.internals.store.windowMounts.filter((x) => {
        return x.uuid != windowMount.uuid
      })
    },
    getRecommendedPosition(windowMount) {},
    getStackingIndex(windowMount) {},
    async closeAllWindowsByRootMount(consumerRootMount) {
      return new Promise((resolve) => {
        this.internals.store.windowMounts.forEach((windowMount) => {
          if (windowMount.owner.$options.__name == consumerRootMount.$options.__name) {
            windowMount.close()
          }
        })
        setTimeout(() => {
          resolve()
        }, 500)
      })
    },
  },
}
