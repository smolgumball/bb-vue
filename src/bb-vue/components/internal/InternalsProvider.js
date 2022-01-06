import { getGlobal } from '/bb-vue/lib.js'

export default {
  name: 'bbv-internals-provider',
  props: {
    internals: {
      type: Object,
      required: true,
    },
  },
  provide() {
    const Vue = getGlobal('Vue')
    console.debug('bbv-internals-provider:provide')
    return Vue.reactive({
      internals: this.internals,
    })
  },
  render() {
    console.debug('bbv-internals-provider:render')
    return this.$slots.default()
  },
}
