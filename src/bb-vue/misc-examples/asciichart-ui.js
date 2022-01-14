import AppFactory from '/bb-vue/AppFactory.js'

// prettier-ignore
import { css, getGlobal, html, setGlobal } from '/bb-vue/lib.js'

// ascii dep
import asciichart from '/bb-vue/misc-examples/asciichart-lib.js'

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  try {
    await new AppFactory(ns).mount({
      config: { id: 'ascii-chart-app' },
      rootComponent: MyAppComponent,
    })
  } catch (error) {
    console.error(error)
    ns.tprint(error.toString())
    ns.exit()
  }
}

const MyAppComponent = {
  name: 'ascii-chart',
  inject: ['appShutdown'],
  template: html`
    <bbv-win
      class="__CMP_NAME__"
      title="ASCII Chart"
      no-pad
      start-width="50%"
      start-height="400px"
      @pointerenter="pauseAutoScroll = true"
      @pointerleave="pauseAutoScroll = false"
    >
      <!-- prettier-ignore -->
      <pre
        class="chartDisplay"
        ref="chartDisplay"
      >{{ this.chartOutput }}</pre>
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

  watch: {
    chartOutput() {
      if (this.pauseAutoScroll) return
      this.$refs.chartDisplay?.scrollTo(0, 0)
    },
  },

  mounted() {
    let bus = getGlobal('asciiBus')
    if (!bus) {
      bus = getGlobal('Mitt').createBus()
      setGlobal('asciiBus', bus)
    }
    bus.on('asciiChartCollector', this.handleBusEvent)
  },

  methods: {
    handleBusEvent(data) {
      this.chartHistory = [data?.value, ...this.chartHistory]
      if (this.chartHistory.length > 600) {
        this.chartHistory.pop()
      }
    },
  },

  scss: css`
    @font-face {
      font-family: 'FreeMono';
      src: url('https://gumballcdn.netlify.app/FreeMono.woff2') format('woff2');
    }

    .__CMP_NAME__ {
      .win_content {
        display: flex;
        align-items: center;
      }

      .chartDisplay {
        @include bbv-scrollbar;

        font-family: 'FreeMono';
        width: 100%;
        overflow: auto;
        font-weight: bold;
        margin: 0;
      }
    }
  `,
}
