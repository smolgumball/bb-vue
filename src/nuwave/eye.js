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
      <!-- Main window -->
      <bbv-win title="🧿">
        <div class="macroInput">
          <label class="ez-input">
            <span>Target:</span>
            <input @keydown.enter="runHack" type="text" v-model="macroInputs.hack" />
            <bbv-button @click="runHack">Hack</bbv-button>
          </label>
          <label class="ez-input">
            <span>Target:</span>
            <input @keydown.enter="runGrow" type="text" v-model="macroInputs.grow" />
            <bbv-button @click="runGrow">Grow</bbv-button>
          </label>
          <label class="ez-input">
            <span>Target:</span>
            <input @keydown.enter="runWeaken" type="text" v-model="macroInputs.weaken" />
            <bbv-button @click="runWeaken">Weaken</bbv-button>
          </label>
        </div>
        <div class="btn-zone">
          <bbv-button @click="runTest">Scheduler Test</bbv-button>
        </div>
        <template #actions>
          <span><strong>Uptime:</strong> {{ uptime }}</span>
          <bbv-button @click="doShutdown" small>🛑 Shutdown</bbv-button>
        </template>
      </bbv-win>

      <!-- Player window -->
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

      <!-- Servers window -->
      <bbv-win
        ref="srv"
        no-pad
        :start-open="false"
        start-width="40%"
        start-height="50%"
        title="💽 Servers"
      >
        <bbv-json-display fill :data="store.srv" />
      </bbv-win>

      <!-- Processes window -->
      <bbv-win
        ref="proc"
        no-pad
        :start-open="true"
        start-width="40%"
        start-height="50%"
        :start-position="{ x: 730, y: 55 }"
        title="🔢 Processes"
      >
        <bbv-json-display fill :data="store.proc" />
      </bbv-win>

      <!-- Add actions to tray -->
      <teleport to="#app-tray">
        <bbv-button @click="doShutdown">🛑</bbv-button>
      </teleport>
    </main>
  `,
  setup() {
    const { inject, ref, computed, reactive } = Vue()
    const { useTimestamp } = VueUse()

    // Windows
    const player = ref(null)
    const srv = ref(null)
    const proc = ref(null)

    // Store
    const store = getGlobal('nuMain.store.data')
    const macroInputs = reactive({
      hack: '',
      grow: '',
      weaken: '',
    })

    // Uptime
    const startTime = Date.now()
    const timestamp = useTimestamp({ interval: 1000 })
    const uptime = computed(() => timeDiff(startTime, timestamp.value))

    // Macros
    const runTest = () => {
      getGlobal('nuMain.bus').emit('nuScheduler:add', {
        path: '/nuwave/exec/_test.js',
        options: {
          bounceBack: 'hello there!',
        },
      })
    }
    const runHack = () => {
      getGlobal('nuMain.bus').emit('nuScheduler:add', {
        path: '/nuwave/exec/h.js',
        options: {
          target: macroInputs.hack,
        },
      })
      macroInputs.hack = ''
    }
    const runGrow = () => {
      getGlobal('nuMain.bus').emit('nuScheduler:add', {
        path: '/nuwave/exec/g.js',
        options: {
          target: macroInputs.grow,
        },
      })
      macroInputs.grow = ''
    }
    const runWeaken = () => {
      getGlobal('nuMain.bus').emit('nuScheduler:add', {
        path: '/nuwave/exec/w.js',
        options: {
          target: macroInputs.weaken,
        },
      })
      macroInputs.weaken = ''
    }

    // Shutdown
    const rootShutdown = inject('rootShutdown')
    const doShutdown = () => {
      rootShutdown()
      getGlobal('nuMain.bus').emit('nuMain:shutdown')
    }

    return {
      player,
      srv,
      proc,
      store,
      uptime,
      macroInputs,
      runHack,
      runGrow,
      runWeaken,
      runTest,
      doShutdown,
    }
  },
  scss: css`
    .__CMP_NAME__ {
      .bbv-json-display {
      }

      .btn-zone {
        padding-top: 10px;
        text-align: right;
      }

      .ez-input {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        align-items: center;
        margin-bottom: 10px;

        & > span {
          font-size: 14px;
          width: 100%;
        }

        & > input {
          width: 75%;
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          line-height: 1;
          padding: 5px 3px;
          border: none;
          border-bottom: 2px solid var(--bbvInputBorderPositiveColor);
          background-color: var(--bbvHackerDarkBgColor);
          color: var(--bbvHackerDarkFgColor);

          &:focus {
            outline: none;
          }
        }

        & > .bbv-button {
          width: 20%;
        }
      }
    }
  `,
}
