import { css, getGlobal, html, isBlank, lodash, sleep, Vue, VueUse } from '/bb-vue/lib.js'
import { termRun } from '/nuburn/lib/term.js'
import { timeDiff } from '/nuburn/lib/date.js'
import { ReplEvents } from '/nuburn/lib/globals.js'

export default {
  name: 'eye-repl',
  template: html`
    <main class="__CMP_NAME__">
      <!-- Main window -->
      <bbv-win title="🔋 REPL" no-pad start-width="640px" start-height="550px">
        <textarea
          class="replScript"
          spellcheck="false"
          placeholder="Enter code... ns and await are available. Remember to return any values you'd like to inspect. Logs will be synced as the task runs, and again at the end."
          v-model="cmpData.workingScript"
          :disabled="storeData.queuePaused"
          @keydown.enter.ctrl="replRun"
        />
        <bbv-button class="replRun" @click="replRun" :disabled="storeData.queuePaused">
          <template v-if="storeData.queuePaused"><code>Running...</code></template>
          <template v-else>Run</template>
        </bbv-button>
        <bbv-object-display class="replResult" :data="replDisplay" />
        <template #actions>
          <span><strong>Uptime:</strong> {{ uptime }}</span>
          <bbv-button @click="doShutdown" small>🛑 Shutdown</bbv-button>
        </template>
      </bbv-win>

      <!-- Add actions to tray -->
      <teleport to="#app-tray">
        <bbv-button title="Reboot" @click="doReboot">💫</bbv-button>
      </teleport>
    </main>
  `,
  setup() {
    const { inject, computed, reactive } = Vue()
    const { useTimestamp } = VueUse()

    // Uptime
    const startTime = Date.now()
    const timestamp = useTimestamp({ interval: 1000 })
    const uptime = computed(() => timeDiff(startTime, timestamp.value))

    // Repl behavior
    const replBus = getGlobal('nuRepl').bus
    const storeData = getGlobal('nuRepl').store
    const cmpData = reactive({
      workingScript: null,
    })
    const replDisplay = computed(() => {
      const defaultState = { state: 'waiting for command...' }
      let objToReturn = storeData.currentRun ?? storeData.runHistory[0]
      objToReturn = lodash.omit({ ...objToReturn }, ['uuid', 'scriptEncoded', 'path'])
      return isBlank(objToReturn) ? defaultState : objToReturn
    })

    // Dispatch a repl run to the long-running dispatcher process
    const replRun = () => {
      if (isBlank(cmpData.workingScript)) return
      replBus.emit(ReplEvents.runScript, { script: cmpData.workingScript })
    }

    // Shutdown
    const appShutdown = inject('appShutdown')
    const doShutdown = () => {
      appShutdown()
      replBus.emit(ReplEvents.doShutdown)
    }

    // Reboot
    const doReboot = async () => {
      doShutdown()
      await sleep(1000)
      await termRun('run /nuburn/repl.js')
    }

    return {
      storeData,
      cmpData,
      replDisplay,
      replRun,
      uptime,
      doShutdown,
      doReboot,
    }
  },
  scss: css`
    .__CMP_NAME__ {
      .replScript {
        @include typo-basic;
        @include bbv-scrollbar;

        border: none;
        resize: none;
        width: 100%;
        min-height: 200px;
        padding: 12px;
        color: var(--bbvHackerDarkFgColor);
        background-color: var(--bbvHackerDarkBgColor);
        line-height: 1.5;

        &:focus {
          outline: none;
        }

        &::placeholder {
          color: var(--bbvFontLightColor);
          line-height: 1.5;
        }
      }

      .replRun {
        margin-top: -5px;
        font-size: 18px;
        text-transform: uppercase;
        padding: 12px;
        width: 100%;

        &[disabled] {
          filter: greyscale(1);
          pointer-events: none;
          cursor: wait;
        }
      }

      .replResult {
        padding-top: 5px;
        min-height: 130px;
        box-shadow: none;
      }
    }
  `,
}
