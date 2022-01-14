import { css, html, Vue, VueUse } from '/bb-vue/lib.js'
import { timeDiff } from '/nuburn/lib/date.js'
import { nuEmit, nuStore } from '/nuburn/lib/getters.js'

import AppFactory from '/bb-vue/AppFactory.js'
import EyeMacros from '/nuburn/EyeMacros.js'
import EyeInput from '/nuburn/EyeInput.js'
import EyeProcList from '/nuburn/EyeProcList.js'

export default class Eye {
  ns
  appHandle

  constructor(ns) {
    this.ns = ns
  }

  async init() {
    const app = new AppFactory(this.ns)
    this.appHandle = await app.mount({
      config: {
        id: crypto.randomUUID(),
        showTips: false,
        shutdownRootWithPid: this.ns.getRunningScript().pid,
        forceReload: true,
      },
      rootComponent: EyeRoot,
      components: [EyeMacros, EyeInput, EyeProcList],
    })
  }
}

const EyeRoot = {
  name: 'eye-root',
  template: html`
    <main class="__CMP_NAME__">
      <!-- Main window -->
      <bbv-win title="🧿" no-pad>
        <eye-macros />
        <template #actions>
          <span><strong>Uptime:</strong> {{ uptime }}</span>
          <bbv-button @click="doShutdown" small>🛑 Shutdown</bbv-button>
        </template>
      </bbv-win>

      <!-- Player window -->
      <bbv-win no-pad :start-open="false" start-width="40%" start-height="50%" title="✨ Player">
        <bbv-json-display fill :data="store.player" />
      </bbv-win>

      <!-- Servers window -->
      <bbv-win no-pad :start-open="false" start-width="40%" start-height="50%" title="💽 Servers">
        <bbv-json-display fill :data="store.srv" />
      </bbv-win>

      <!-- Raw proc window -->
      <bbv-win
        no-pad
        :start-open="true"
        start-width="40%"
        start-height="50%"
        :start-position="{ x: 730, y: 55 }"
        title="🔢 Raw Proc"
      >
        <bbv-json-display fill :data="store.proc" />
      </bbv-win>

      <!-- Processes window -->
      <bbv-win
        no-pad
        no-scroll
        :start-open="true"
        start-width="40%"
        start-height="50%"
        :start-position="{ x: 730, y: 400 }"
        title="🔢 Pretty Proc"
      >
        <eye-proc-list />
      </bbv-win>

      <!-- Add actions to tray -->
      <teleport to="#app-tray">
        <bbv-button @click="doShutdown">🛑</bbv-button>
      </teleport>
    </main>
  `,
  setup() {
    const { inject, computed } = Vue()
    const { useTimestamp } = VueUse()

    // Store
    const store = nuStore()

    // Uptime
    const startTime = Date.now()
    const timestamp = useTimestamp({ interval: 1000 })
    const uptime = computed(() => timeDiff(startTime, timestamp.value))

    // Shutdown
    const rootShutdown = inject('rootShutdown')
    const doShutdown = () => {
      rootShutdown()
      nuEmit('nuMain:shutdown')
    }

    return {
      store,
      uptime,
      doShutdown,
    }
  },
  scss: css`
    .__CMP_NAME__ {
    }
  `,
}
