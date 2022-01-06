import { getGlobal } from '/bb-vue/lib.js'
import { html } from '/bitburner-vue/lib.js'

export default {
  name: 'bbv-stylesheet-manager',
  props: {
    consumerRootDefs: {
      type: Array,
      required: true,
    },
  },
  computed: {
    rootOptions() {
      return this.$root.$options
    },
    styles() {
      const Vue = getGlobal('Vue')
      let styles = { root: '' }
      let consumerRootDefKeys = this.consumerRootDefs.map((x) => x.name).join(':')
      styles.root = this.rootOptions.__finalStyles
      styles.root[0] = `/* ${consumerRootDefKeys} */ \n ${styles.root[0]}`
      Vue.markRaw([...this.consumerRootDefs]).forEach((appDefinition) => {
        styles[appDefinition.name] = appDefinition.__finalStyles
      })
      return styles
    },
  },
  template: html`
    <component
      is="style"
      v-for="(styles, appName) in styles"
      :key="appName"
      :id="'styles-for-' + appName"
      type="text/css"
      >{{ styles.join('') }}</component
    >
  `,
}
