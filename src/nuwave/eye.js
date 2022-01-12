import AppFactory from '/bb-vue/AppFactory.js'
import { css, getGlobal, html, Vue, VueUse } from '/bb-vue/lib.js'
import { timeDiff } from '/nuwave/lib.js'

export default class Eye {
  ns
  appHandle

  constructor(ns) {
    this.ns = ns
  }

  async init() {
    const app = new AppFactory(this.ns)
    this.appHandle = await app.mount({
      config: { id: crypto.randomUUID(), showTips: false },
      rootComponent: EyeRoot,
    })
  }
}

const EyeRoot = {
  name: 'eye-root',
  template: html`
    <main class="__CMP_NAME__">
      <bbv-win title="🧿 nuEye">
        <div class="buttonZone">
          <bbv-button @click="() => player.open()">✨</bbv-button>
          <bbv-button @click="() => srv.open()">💽</bbv-button>
          <bbv-button @click="() => proc.open()">🔢</bbv-button>
        </div>
        <template #actions>
          <span><strong>Uptime:</strong> {{ uptime }}</span>
          <bbv-button @click="doShutdown" small>🛑 Shutdown</bbv-button>
        </template>
      </bbv-win>
      <bbv-win
        ref="player"
        no-pad
        :start-open="false"
        start-width="40%"
        start-height="50%"
        title="✨ Player"
      >
        <bbv-json-display fill :data="store.player" />
      </bbv-win>
      <bbv-win
        ref="srv"
        no-pad
        :start-open="false"
        start-width="40%"
        start-height="50%"
        title="💽 Srv"
      >
        <bbv-json-display fill :data="store.srv" />
      </bbv-win>
      <bbv-win
        ref="proc"
        no-pad
        :start-open="false"
        start-width="40%"
        start-height="50%"
        title="🔢 Proc"
      >
        <bbv-json-display fill :data="store.proc" />
      </bbv-win>
    </main>
  `,
  setup() {
    const { inject, ref, computed } = Vue()
    const { useTimestamp } = VueUse()

    // Windows
    const player = ref(null)
    const srv = ref(null)
    const proc = ref(null)

    // Store
    const store = getGlobal('nuMain.store.data')

    // Uptime
    const startTime = Date.now()
    const timestamp = useTimestamp({ interval: 1000 })
    const uptime = computed(() => timeDiff(startTime, timestamp.value))

    // Shutdown
    const rootShutdown = inject('rootShutdown')
    const doShutdown = () => {
      rootShutdown()
      getGlobal('nuMain.bus').emit('nu:shutdown')
    }

    return {
      player,
      srv,
      proc,
      store,
      uptime,
      doShutdown,
    }
  },
  scss: css`
    .__CMP_NAME__ {
      .bbv-json-display {
      }

      .buttonZone {
        display: flex;
        justify-content: space-around;
      }
    }
  `,
}
