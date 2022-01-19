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
    return {}
  },
  computed: {
    rootOptions() {
      return this.$root.$options
    },
    styles() {
      let styles = { root: '' }
      styles.root = this.rootOptions.__finalStyles
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
        v-for="(sheet, appName) in styles"
        :key="appName"
        :id="'styles-for-' + appName"
        type="text/css"
      >
        {{ sheet.join('') }}
      </component>
    </transition-group>
  `,
}
