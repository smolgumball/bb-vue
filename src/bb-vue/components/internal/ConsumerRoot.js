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
      private: {
        bus,
        consumerRootMount: null,
      },
      appStore: {},
      appListen: bus.on,
      appSend: this.appSendWrapper,
      appShutdown: this.appShutdownWrapper,
    }
  },
  provide() {
    const { reactivePick } = getGlobal('VueUse')
    return reactivePick(this.$data, 'appStore', 'appListen', 'appSend', 'appShutdown')
  },
  methods: {
    appSendWrapper(event, data) {
      switch (event) {
        case 'shutdown':
          this.$emit('consumer-root-shutdown', this.private.consumerRootMount)
          break
        default:
          this.private.bus.emit(event, data)
          break
      }
    },
    appShutdownWrapper() {
      if (!this.private.consumerRootMount) {
        throw new Error('Tried to shutdown a null app root', this.private.consumerRootMount)
      } else {
        this.$emit('consumer-root-shutdown', this.private.consumerRootMount)
      }
    },
    onConsumerRootMounted(vnode) {
      this.private.consumerRootMount = vnode?.component?.ctx
      if (!this.private.consumerRootMount) {
        console.warn(`consumerRootMount is null for ${this.consumerRootDef.__name}`)
      }
      this.$emit('consumer-root-mounted', this.private.consumerRootMount)
    },
  },
  render() {
    const Vue = getGlobal('Vue')
    return Vue.h(
      'section',
      { 'bbv-foreground': true },
      Vue.h(this.consumerRootDef, {
        'app-id': this.consumerRootDef.__appId,
        onVnodeMounted: this.onConsumerRootMounted,
      })
    )
  },
}
