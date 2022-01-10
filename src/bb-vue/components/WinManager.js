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
    getRecommendedPosition(winMount) {
      /**
       * 1. Find largest open winMount
       * 2. Offset from top left of that winMount
       * 3. Apply position constraits as needed
       * 4. Return absolute coordinates in screen space
       */
    },
    bringToFront(winMount) {
      let otherWins = this.internals.store.winMounts.filter((x) => winMount.uuid != x.uuid)
      winMount.stackingIndex = this.baseStackingIndex + otherWins.length + 1
      let sortedOtherWins = [...otherWins].sort((a, b) => a.stackingIndex - b.stackingIndex)
      sortedOtherWins.forEach((x, i) => (x.stackingIndex = this.baseStackingIndex + i))
    },
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
