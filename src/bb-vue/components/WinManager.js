export default {
  name: 'bbv-win-manager',
  inject: ['internals'],
  template: `<!-- __CMP_NAME__ -->`,
  data() {
    return {
      baseStackingIndex: 1510,
    }
  },
  computed: {},
  created() {
    this.internals.winManager = this
  },
  methods: {
    addWin(winMount) {
      this.internals.store.winMounts.push(winMount)
    },
    removeWin(winMount) {
      this.internals.store.winMounts = this.internals.store.winMounts.filter((x) => {
        return x.uuid != winMount.uuid
      })
    },
    getRecommendedPosition(winMount) {},
    getStackingIndex(winMount) {},
    async closeAllWinsByRootMount(consumerRootMount) {
      return new Promise((resolve) => {
        this.internals.store.winMounts.forEach((winMount) => {
          if (winMount.owner.$options.__name == consumerRootMount.$options.__name) {
            winMount.close()
          }
        })
        setTimeout(() => {
          resolve()
        }, 500)
      })
    },
  },
}
