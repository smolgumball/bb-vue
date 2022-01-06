import { getGlobal } from '/bb-vue/lib.js'

export default {
  name: 'bbv-consumer-root',
  emits: ['consumer-root-shutdown', 'consumer-root-mounted'],
  props: {
    consumerRootDef: {
      type: Object,
      required: true,
    },
  },
  data() {
    const Mitt = getGlobal('Mitt')
    let bus = Mitt.createBus()

    return {
      __appBus: bus,
      __consumerRootMountCtx: null,
      appListen: bus.on,
      appSend: this.appSendWrapper,
      appStore: {},
    }
  },
  provide() {
    return this.$data
  },
  methods: {
    appSendWrapper(event, data) {
      switch (event) {
        case 'shutdown':
          this.$emit('consumer-root-shutdown', this.__consumerRootMountCtx)
          break
        default:
          this.__appBus.emit(event, data)
          break
      }
    },
    onConsumerRootMounted(vnode) {
      let consumerRootMountCtx = vnode?.component?.ctx
      this.__consumerRootMountCtx = consumerRootMountCtx
      this.$emit('consumer-root-mounted', consumerRootMountCtx)
    },
  },
  render() {
    const Vue = getGlobal('Vue')
    return Vue.h(
      'section',
      { 'bbv-foreground': true },
      Vue.h(this.consumerRootDef, {
        onVnodeMounted: this.onConsumerRootMounted,
      })
    )
  },
}
