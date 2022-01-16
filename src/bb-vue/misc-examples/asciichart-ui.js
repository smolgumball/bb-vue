import AppFactory from '/bb-vue/AppFactory.js'

// prettier-ignore
import { css, getGlobal, html, setGlobal, sleep } from '/bb-vue/lib.js'

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
    <bbv-win class="__CMP_NAME__" title="ASCII Chart" no-pad start-width="50%">
      <div class="chartBg" @pointerenter="pauseEvents = true" @pointerleave="pauseEvents = false">
        <pre class="chartDisplay" ref="chartDisplay">{{ this.chartOutput }}</pre>
      </div>
      <template #actions>
        <bbv-button @click="appShutdown">🛑 Shutdown</bbv-button>
      </template>
    </bbv-win>
  `,

  data() {
    return {
      bus: null,
      chartHistory: [],
      eventBuffer: [],
      pauseEvents: false,
    }
  },

  computed: {
    chartOutput() {
      if (this.chartHistory.length < 1) return ''
      return asciichart.plot(this.chartHistory)
    },
  },

  watch: {
    pauseEvents(newVal) {
      if (newVal !== true) {
        this.$refs.chartDisplay?.scrollTo({ left: 0, behavior: 'smooth' })
        this.flushBuffer()
      }
    },
  },

  mounted() {
    this.bus = getGlobal('asciiBus')
    if (!this.bus) {
      this.bus = getGlobal('Mitt').createBus()
      setGlobal('asciiBus', this.bus)
    }
    this.bus.on('asciiChartCollector', this.handleBusEvent)
  },

  methods: {
    handleBusEvent(data) {
      if (this.pauseEvents) {
        this.eventBuffer = [data, ...this.eventBuffer]
      } else {
        this.chartHistory = [data?.value, ...this.chartHistory]
      }
      if (this.chartHistory.length > 600) {
        this.chartHistory.pop()
      }
    },
    async flushBuffer() {
      for (let i = this.eventBuffer.length - 1; i >= 0; i--) {
        let entry = this.eventBuffer[i]
        if (!entry) return
        this.bus.emit('asciiChartCollector', entry)
        this.eventBuffer.pop()
        await sleep(10)
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

      .chartBg {
        display: flex;
        align-items: center;
        width: 100%;
        min-height: 350px;
        background-color: var(--bbvHackerDarkBgColor);
        padding: 30px 0;
      }

      .chartDisplay {
        @include bbv-scrollbar;

        overflow: auto;
        padding: 30px 0;
        font-family: 'FreeMono';
        cursor: default;
        user-select: none;
      }
    }
  `,
}
