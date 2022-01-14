import AppFactory from '/bb-vue/AppFactory.js'

// prettier-ignore
import { css, getGlobal, html, setGlobal } from '/bb-vue/lib.js'

// ascii dep
import asciichart from '/bb-vue/misc-examples/asciichart.js'

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  try {
    const myAppFactory = new AppFactory(ns)
    const myAppHandleFn = await myAppFactory.mount({
      config: { id: 'ascii-chart-app' },
      rootComponent: MyAppComponent,
    })
    console.debug(myAppHandleFn())
  } catch (error) {
    // In case something goes wrong, log it out and halt the program
    console.error(error)
    ns.tprint(error.toString())
    ns.exit()
  }
}

const MyAppComponent = {
  name: 'ascii-chart',
  inject: ['appShutdown'],
  template: html`
    <bbv-win class="__CMP_NAME__" title="ASCII Chart">
      <p>ASCII Chart:</p>
      <code><pre>{{ this.chartOutput }}</pre></code>
      <template #actions>
        <bbv-button @click="appShutdown">🛑 Shutdown</bbv-button>
      </template>
    </bbv-win>
  `,

  data() {
    return {
      chartHistory: [],
    }
  },

  computed: {
    chartOutput() {
      if (this.chartHistory.length < 1) return ''
      return asciichart.plot(this.chartHistory)
    },
  },

  mounted() {
    let bus = getGlobal('asciiBus')
    if (!bus) {
      bus = getGlobal('Mitt').createBus()
      setGlobal('asciiBus', bus)
    }
    bus.on('dataFromScript', this.handleBusEvent)
  },

  methods: {
    handleBusEvent(data) {
      this.chartHistory.push(data?.value)
    },
  },

  scss: css`
    .__CMP_NAME__ {
    }
  `,
}
