import AppFactory from '/bb-vue/AppFactory.js'

// prettier-ignore
import { css, html } from '/bb-vue/lib.js'

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
      chartOutput: '',
    }
  },

  async mounted() {
    this.runAsciiChart()
  },

  methods: {
    runAsciiChart() {
      var s0 = new Array(120)
      for (var i = 0; i < s0.length; i++) s0[i] = 15 * Math.sin(i * ((Math.PI * 4) / s0.length))
      this.chartOutput = asciichart.plot(s0)
    },
  },

  scss: css`
    .__CMP_NAME__ {
    }
  `,
}
