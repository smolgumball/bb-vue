import AppFactory from '/bb-vue/AppFactory.js'

// prettier-ignore
import { css, getGlobal, html, setGlobal } from '/bb-vue/lib.js'

// ascii dep
import asciichart from '/bb-vue/misc-examples/asciichart.js'

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
    <bbv-win class="__CMP_NAME__" title="ASCII Chart" no-pad start-width="50%" start-height="400px">
      <!-- prettier-ignore -->
      <pre
        class="chartDisplay"
        ref="chartDisplay"
        @pointerenter="pauseAutoScroll = true"
        @pointerleave="pauseAutoScroll = false"
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
      this.$refs.chartDisplay?.scrollTo(Number.MAX_SAFE_INTEGER, 0)
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
      if (this.chartHistory.length > 350) {
        this.chartHistory.shift()
      }
    },
  },

  scss: css`
    @font-face {
      font-family: 'FreeMono';
      src: url('https://gumballcdn.netlify.app/freemono.ttf') format('ttf');
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
