import { Mitt, Vue, VueUse } from '/bb-vue/lib.js'

export default {
  name: 'bbv-consumer-root',
  emits: ['consumer-root-mounted', 'consumer-root-unmounted', 'root-shutdown-requested'],
  props: {
    consumerRootDef: {
      type: Object,
      required: true,
    },
  },
  data() {
    const bus = Mitt().createBus()

    return {
      private: {
        bus,
        consumerRootMount: null,
      },
      appStore: {},
      appListen: bus.on,
      appSend: this.appSendWrapper,
      appShutdown: this.appShutdownWrapper,
      rootShutdown: this.rootShutdownWrapper,
    }
  },
  provide() {
    const { reactivePick } = VueUse()
    return reactivePick(
      this.$data,
      'appStore',
      'appListen',
      'appSend',
      'appShutdown',
      'rootShutdown'
    )
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
        this.$emit('consumer-root-unmounted', this.private.consumerRootMount)
      }
    },
    rootShutdownWrapper() {
      this.$emit('root-shutdown-requested')
    },
    consumerRootMounted(vnode) {
      this.private.consumerRootMount = vnode?.component?.ctx
      if (!this.private.consumerRootMount) {
        console.warn(`App root is null for ${this.consumerRootDef.__uuid}`)
      }
      this.$emit('consumer-root-mounted', this.private.consumerRootMount)
    },
  },
  render() {
    const { h } = Vue()
    return h(
      'section',
      { 'bbv-foreground': true },
      h(this.consumerRootDef, {
        onVnodeMounted: this.consumerRootMounted,
      })
    )
  },
}
