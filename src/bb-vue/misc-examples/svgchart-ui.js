import AppFactory from '/bb-vue/AppFactory.js'

// prettier-ignore
import { css, html } from '/bb-vue/lib.js'

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  try {
    await new AppFactory(ns).mount({
      config: { id: 'svg-chart-app' },
      rootComponent: ChartContainer,
    })
  } catch (error) {
    console.error(error)
    ns.tprint(error.toString())
    ns.exit()
  }
}

export const SVGChartContainer = 'svgChartContainer'

const ChartContainer = {
  name: 'svg-chart',
  inject: ['appShutdown'],
  template: html`
    <bbv-win class="__CMP_NAME__" title="SVG Chart" no-pad start-height="80%" start-width="80%">
      <div v-once id="${SVGChartContainer}" />
      <template #actions>
        <bbv-button @click="appShutdown">🛑 Shutdown</bbv-button>
      </template>
    </bbv-win>
  `,

  data() {
    return {}
  },

  computed: {},

  watch: {},

  mounted() {},

  methods: {},

  scss: css`
    .__CMP_NAME__ {
    }
  `,
}
