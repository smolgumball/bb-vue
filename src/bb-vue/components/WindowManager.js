import { html, css } from '/bb-vue/lib.js'

export default {
  name: 'bbv-window-manager',
  template: html``,
  data() {
    return {
      mountedWindows: [],
    }
  },
  created() {
    this.$listen('window:created', this.events.onWindowCreated)
    this.$listen('window:destroyed', this.events.onWindowDestroyed)
  },
  methods: {
    events: {
      onWindowCreated(win) {
        let windowCount = this.mountedWindows.length
        this.mountedWindows.push(win)
        if (windowCount > 1) {
          this.placeWindow(win, WindowPositionStrategies.cascadeStack)
        }
      },
      onWindowDestroyed(win) {
        this.mountedWindows = this.mountedWindows.filter((x) => x.uuid != win.uuid)
      },
    },
  },
  scssResources: css``,
  scss: css``,
}
