import { WinStates } from '/bb-vue/components/internal/_resources.js'
import { css, html, sleep, Vue, VueUse, timeDiff } from '/bb-vue/lib.js'
import { nuStore, nuShutdown } from '/nuburn/lib/globals.js'
import { termRun } from '/nuburn/lib/term.js'

export default {
  name: 'eye-root',
  template: html`
    <main class="__CMP_NAME__" eye-root>
      <!-- Scripts window -->
      <bbv-win
        no-pad
        :start-open="true"
        start-width="570px"
        start-height="640px"
        title="📃 Scripts"
      >
        <eye-scripts-list />
      </bbv-win>

      <!-- Macros window -->
      <bbv-win
        no-pad
        :start-open="false"
        start-width="590px"
        start-height="360px"
        title="🧰 Macros"
      >
        <eye-macros />
        <template #actions>
          <span><strong>Uptime:</strong> {{ uptime }}</span>
        </template>
      </bbv-win>

      <!-- Player window -->
      <bbv-win no-pad :start-open="false" start-width="40%" start-height="50%" title="✨ Player">
        <bbv-object-display :data="store.player" />
      </bbv-win>

      <!-- Servers window -->
      <bbv-win no-pad :start-open="false" start-width="40%" start-height="50%" title="💽 Servers">
        <bbv-object-display :data="store.srv" />
      </bbv-win>

      <!-- Runner window -->
      <bbv-win
        no-pad
        no-scroll
        :start-open="false"
        start-width="40%"
        start-height="50%"
        title="🏃 Runner"
      >
        <eye-runner-list />
      </bbv-win>

      <!-- Add actions to tray -->
      <teleport to="#app-tray">
        <bbv-button title="Minimize All" @click="doMassMinimize" small>
          <span v-if="massMinimize.isActive !== true">⏬</span>
          <span v-else>⏫</span>
        </bbv-button>
        <bbv-button title="Shutdown Eye" @click="doShutdown" small>🛑 Eye</bbv-button>
        <bbv-button title="Reboot Eye" @click="doReboot" small>💫 Eye</bbv-button>
      </teleport>
    </main>
  `,
  setup() {
    const { inject, computed, reactive } = Vue()
    const { useTimestamp } = VueUse()

    // Store
    const store = nuStore()
    const internalStore = inject('internals').store

    // Uptime
    const startTime = Date.now()
    const timestamp = useTimestamp({ interval: 1000 })
    const uptime = computed(() => timeDiff(startTime, timestamp.value))

    // Mass minimize
    const massMinimize = reactive({ isActive: false, prevWinMounts: [] })
    const winMounts = computed(() => internalStore.winMounts)
    const doMassMinimize = () => {
      if (massMinimize.isActive === false) {
        const openWinMounts = winMounts.value.filter((x) => x.winState == WinStates.open)
        if (openWinMounts.length === 0) return
        openWinMounts.forEach((x) => x.close())
        massMinimize.prevWinMounts = openWinMounts
        massMinimize.isActive = true
      } else {
        if (massMinimize.prevWinMounts.length) {
          massMinimize.prevWinMounts.forEach((x) => x.open())
          massMinimize.prevWinMounts = []
          massMinimize.isActive = false
        }
      }
    }

    // Shutdown
    const appShutdown = inject('appShutdown')
    const doShutdown = () => {
      appShutdown()
      nuShutdown()
    }
    const doReboot = async () => {
      doShutdown()
      await sleep(1000)
      await termRun('run /nuburn/start.js')
    }

    return {
      store,
      massMinimize,
      uptime,
      doMassMinimize,
      doShutdown,
      doReboot,
    }
  },
  scss: css`
    .__CMP_NAME__ {
    }

    /* Modify root sidebar to tighten up spacing */
    #root > div > div > .MuiDrawer-root {
      .MuiListItem-root {
        padding-top: 4px;
        padding-bottom: 4px;
      }

      .MuiListItemIcon-root {
        svg {
          /* width: 0.85em;
          height: 0.85em; */
        }
      }

      .MuiListItemText-root {
        p {
          font-size: 0.9rem;
        }
      }
    }
  `,
}
