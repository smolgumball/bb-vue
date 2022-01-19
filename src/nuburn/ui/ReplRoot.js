import { css, getGlobal, html, isBlank, lodash, sleep, Vue, VueUse } from '/bb-vue/lib.js'
import { termRun } from '/nuburn/lib/term.js'
import { timeDiff } from '/nuburn/lib/date.js'
import { ReplEvents } from '/nuburn/lib/globals.js'

// Global side effect
// eslint-disable-next-line no-unused-vars
import Prism from '/nuburn/vendor/Prism.js'
import PrismStyles from '/nuburn/vendor/Prism.Styles.js'
import PrismEditorComponentStyles from '/nuburn/vendor/PrismEditorComponent.Styles.js'

export default {
  name: 'eye-repl',
  template: html`
    <main class="__CMP_NAME__">
      <!-- Main window -->
      <bbv-win title="🔋 REPL" no-pad start-width="640px" start-height="640px" @resize="">
        <bbv-prism-editor
          v-model="cmpData.workingScript"
          placeholder="Enter code... ns and await are available. Remember to return any values you'd like to inspect. Logs will be synced as the task runs, and again at the end."
          :highlight="prismHighlight"
          language="javascript"
          class="replScript"
          :class="{ noCode: isBlank(cmpData.workingScript) }"
          :style="cmpData.replStyle"
          :line-numbers="true"
          :readonly="storeData.replBusy"
          @keydown.enter.ctrl="replRun"
        />
        <div class="replControls">
          <bbv-button
            class="replRun"
            :class="{ isRunning: storeData.replBusy }"
            @click="() => storeData.replBusy ? replKill() : replRun()"
          >
            <template v-if="storeData.replBusy">Running... <code>Kill?</code></template>
            <template v-else>Run</template>
          </bbv-button>
          <eye-input
            inline
            class="replThreads"
            label="t="
            v-model="cmpData.workingThreads"
            @activate="replRun"
          />
        </div>
        <bbv-object-display class="replResult" :data="replDisplay" />
        <template #actions>
          <span><strong>Uptime:</strong> {{ uptime }}</span>
          <bbv-button @click="doShutdown" small>🛑 Shutdown</bbv-button>
        </template>
      </bbv-win>

      <!-- Add actions to tray -->
      <teleport to="#app-tray">
        <bbv-button title="Reboot" @click="doReboot">💫 REPL</bbv-button>
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
      workingThreads: 1,
      monacoBooted: false,
      replStyle: {},
    })
    const replDisplay = computed(() => {
      const defaultState = { state: 'waiting for command...' }
      let objToReturn = storeData.currentRun ?? storeData.runHistory[0]
      objToReturn = lodash.omit({ ...objToReturn }, ['uuid', 'scriptPrepped', 'wantsShutdown'])
      return isBlank(objToReturn) ? defaultState : objToReturn
    })
    cmpData.replStyle = computed(() => {
      let loc = cmpData.workingScript?.split('\n')?.length ?? 0
      return {
        height: `calc((1.1em * ${Math.max(loc, 5)}) + 12px)`,
      }
    })

    // Dispatch a repl run to the long-running dispatcher process
    const replRun = () => {
      if (isBlank(cmpData.workingScript)) return
      if (storeData.replBusy) return
      replBus.emit(ReplEvents.runScript, {
        script: cmpData.workingScript,
        threads: cmpData.workingThreads,
      })
    }

    // Mark a run for shutdown
    const replKill = () => {
      storeData.currentRun.wantsShutdown = true
    }

    const prismHighlight = (code) => {
      return Prism.highlight(
        code,
        {
          ...Prism.languages['js'],
        },
        'javascript'
      )
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
      uptime,
      isBlank,
      replRun,
      replKill,
      prismHighlight,
      doShutdown,
      doReboot,
    }
  },
  scss: css`
    .__CMP_NAME__ {
      .monacoWrap {
        height: 300px;
      }

      .replScript {
        @include typo-basic;
        @include bbv-scrollbar;

        border: none;
        resize: none;
        width: 100%;
        min-height: 135px;
        padding: 6px 12px 6px 0px;
        background-color: var(--bbvHackerDarkBgColor);

        &.noCode {
          .prism-editor__container {
            height: 100%;
          }
        }
      }

      .replControls {
        display: flex;
      }

      .replRun {
        font-size: 16px;
        text-transform: uppercase;
        padding: 10px 10px 13px 10px;
        flex-grow: 1;

        &.isRunning {
          animation: bbvFlashBusy 1s ease-in-out 0s infinite alternate;
        }
      }

      .replThreads {
        width: 80px;
      }

      .replResult {
        min-height: 130px;
        box-shadow: none;
      }
    }
  `,
  css: [PrismStyles, PrismEditorComponentStyles].join('\n'),
}
