import { WinStates } from '/bb-vue/components/internal/_resources.js'

export default {
  name: 'bbv-win-manager',
  inject: ['internals'],
  template: `<!-- __CMP_NAME__ -->`,
  data() {
    return {
      baseStackingIndex: 1610,
      recentlyActiveWinMounts: [],
    }
  },
  created() {
    this.internals.winManager = this
  },
  methods: {
    addWin(winMount) {
      this.internals.store.winMounts.push(winMount)
    },
    removeWin(winMount) {
      this.scrubRecentWinMountActivity(winMount)
      this.internals.store.winMounts = this.internals.store.winMounts.filter((x) => {
        return x.uuid != winMount.uuid
      })
    },
    logRecentWinMountActivity(winMount) {
      if (this.recentlyActiveWinMounts[0] == winMount) return
      this.recentlyActiveWinMounts = [winMount, ...this.recentlyActiveWinMounts.slice(0, 4)]
    },
    scrubRecentWinMountActivity(winMount) {
      this.recentlyActiveWinMounts = this.recentlyActiveWinMounts.filter((x) => x !== winMount)
    },
    getRecommendedPosition(winMount) {
      const rootOffset = { x: 265, y: 15 }
      const standardOffset = { x: 60, y: 100 }

      let curOffset = rootOffset
      let targetWinMount = this.recentlyActiveWinMounts[1]
      if (targetWinMount && targetWinMount.winState === WinStates.open) curOffset = standardOffset
      if (!targetWinMount) targetWinMount = winMount

      return {
        x: parseInt(targetWinMount.style.left ?? 0) + curOffset.x,
        y: parseInt(targetWinMount.style.top ?? 0) + curOffset.y,
      }
    },
    bringToFront(winMount) {
      let otherWins = this.internals.store.winMounts.filter((x) => winMount.uuid != x.uuid)
      this.logRecentWinMountActivity(winMount)
      winMount.stackingIndex = this.baseStackingIndex + otherWins.length
      let sortedOtherWins = [...otherWins].sort((a, b) => a.stackingIndex - b.stackingIndex)
      sortedOtherWins.forEach((x, i) => (x.stackingIndex = this.baseStackingIndex + i))
    },
    async closeAllWinsByCrmUuid(crmUuid) {
      return new Promise((resolve) => {
        this.internals.store.winMounts.forEach((winMount) => {
          if (winMount.owner.$options.__uuid == crmUuid) {
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
