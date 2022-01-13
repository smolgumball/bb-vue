// prettier-ignore
import { html } from '/bb-vue/lib.js'

export default {
  name: 'bbv-css-manager',
  props: {
    consumerRootDefs: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      firstRun: true,
    }
  },
  computed: {
    rootOptions() {
      return this.$root.$options
    },
    styles() {
      let styles = { root: '' }
      let consumerRootDefKeys = this.consumerRootDefs
        .map((appDefinition) => appDefinition.__uuid)
        .join(':')
      this.firstRun = false

      styles.root = this.rootOptions.__finalStyles
      styles.root[0] = `/* ${consumerRootDefKeys} */ \n ${styles.root[0]}`

      this.consumerRootDefs.forEach((appDefinition) => {
        styles[appDefinition.__uuid] = appDefinition.__finalStyles
      })

      return styles
    },
  },
  template: html`
    <transition-group :duration="{ enter: 0, leave: 1000 }">
      <component
        is="style"
        v-for="(styles, appName) in styles"
        :key="appName"
        :id="'styles-for-' + appName"
        type="text/css"
        >{{ styles.join('') }}</component
      >
    </transition-group>
  `,
}
