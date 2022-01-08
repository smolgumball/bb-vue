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
    this.internals.listen('window-mounted', this.addWindow)
    this.internals.listen('window-before-unmount', this.removeWindow)
  },
  methods: {
    addWindow({ windowMount }) {
      this.internals.store.windowMounts.push(windowMount)
    },
    removeWindow({ windowMount }) {
      this.internals.store.windowMounts = this.internals.store.windowMounts.filter((x) => {
        return x.uuid != windowMount.uuid
      })
    },
    getRecommendedPosition(windowMount) {},
    getStackingIndex(windowMount) {},
  },
}
