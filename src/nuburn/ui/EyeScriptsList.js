import { css, formatRam, html, lodash, Vue } from '/bb-vue/lib.js'
import { nuEmit, nuStore } from '/nuburn/lib/globals.js'

export default {
  name: 'eye-scripts-list',
  template: html`
    <div class="__CMP_NAME__">
      <div class="laneWrap">
        <div class="lane active">
          <div class="laneTitle">Active</div>
          <transition-group name="scriptList">
            <template v-if="ignoredScripts">
              <div class="script ignored" key="ignored">
                <ul>
                  <li>ignoring <code>{{ ignoredScripts.numIgnored }}</code> scripts</li>
                  <li>with <code>{{ ignoredScripts.numThreads }}</code> threads</li>
                  <li>using <code>{{ ignoredScripts.totalRam }}</code> RAM</li>
                </ul>
              </div>
            </template>
            <template v-for="script in lanes.active" :key="script.pid">
              <div class="script twoCol" @click="inspectScript(script.pid)">
                <div class="details">
                  {{ script.server }} #{{ script.pid }}<br />
                  {{ scriptFilename(script) }}
                </div>
                <div class="actions">
                  <bbv-button icon @click.stop="killScript(script.pid)">❌</bbv-button>
                </div>
              </div>
            </template>
          </transition-group>
        </div>
        <div class="lane killed">
          <div class="laneTitle">Recently Killed</div>
          <transition-group name="scriptList">
            <template v-for="script in lanes.killed" :key="script.pid">
              <div class="script" @click="inspectScript(script.pid)">
                {{ script.server }} #{{ script.pid }}<br />
                {{ scriptFilename(script) }}
              </div>
            </template>
          </transition-group>
        </div>
      </div>
      <template v-for="script in inspectedScriptData" :key="script.pid">
        <teleport to="[eye-root]">
          <bbv-win
            no-pad
            :ref="(win) => { if (win) inspectedWins[script.pid] = win }"
            :title="'🎯 ' + script.server + ' #' + script.pid"
            @close="uninspectScript(script.pid)"
            class="inspectWin"
          >
            <bbv-button
              v-if="script.status !== 'killed'"
              @click="killScript(script.pid)"
              class="killBtn"
              >Kill #{{script.pid}}</bbv-button
            >
            <bbv-object-display :data="script" />
          </bbv-win>
        </teleport>
      </template>
    </div>
  `,
  setup() {
    const { computed, reactive, ref, unref } = Vue()

    // Stores
    const store = nuStore()

    /** @type {{ inspectedPids: string[] }} */
    const cmpData = reactive({
      inspectedPids: [],
    })

    // Computed
    const lanes = computed(() => {
      return {
        active: store.scripts.activeByPid,
        killed: store.scripts.killed,
        ignored: store.scripts.ignored,
      }
    })
    const ignoredScripts = computed(() => {
      if (!lanes?.value) return

      let localLanes = unref(lanes)
      if ((localLanes?.ignored?.length ?? 0) < 1) return

      return {
        numIgnored: localLanes.ignored.length,
        numThreads: localLanes.ignored.reduce((acc, val) => (acc += val.threads), 0),
        totalRam: formatRam(localLanes.ignored.reduce((acc, val) => (acc += val.ramTotal), 0)),
      }
    })
    const inspectedWins = ref([])
    const inspectedScriptData = computed(() => {
      return cmpData.inspectedPids.map((pid) => {
        pid = parseInt(pid)
        const scriptDb = [...Object.values(lanes.value.active), ...lanes.value.killed]
        return scriptDb.find((x) => pid == x.pid)
      })
    })

    // Methods
    const scriptFilename = (script) => {
      if (script.filename.includes('/tmp-repl/')) return '[tmp repl script]'
      return script.filename
    }
    const inspectScript = (pid) => {
      pid = parseInt(pid)
      if (cmpData.inspectedPids.includes(pid)) {
        inspectedWins.value[pid]?.bringToFront()
        return
      }
      cmpData.inspectedPids.push(pid)
    }
    const uninspectScript = (pid) => {
      pid = parseInt(pid)
      cmpData.inspectedPids = lodash.without(cmpData.inspectedPids, pid)
      delete inspectedWins.value[pid]
    }
    const killScript = (pid) => {
      nuEmit('nuRunner:add', { operation: 'kill', options: { pid } })
    }

    return {
      store,
      cmpData,
      lanes,
      ignoredScripts,
      inspectedWins,
      inspectedScriptData,
      inspectScript,
      killScript,
      uninspectScript,
      scriptFilename,
    }
  },
  scss: css`
    .__CMP_NAME__ {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;

      .laneTitle {
        position: absolute;
        z-index: 1500;
        top: 0;
        right: 0;
        padding: 5px;
        text-transform: uppercase;
        background-color: var(--bbvBoxShadowColor2);
        border-bottom-left-radius: 10px;
        filter: brightness(1.4);
      }

      .laneWrap {
        display: flex;
        justify-content: space-between;
        width: 100%;
        height: 100%;

        .lane {
          @include bbv-scrollbar;

          position: relative;
          width: 49.75%;
          height: 100%;
          overflow-y: scroll;
          background-color: var(--bbvBoxShadowColor1);
          padding-top: 25px;

          &.active {
            .laneTitle {
              color: var(--bbvSuccessColor);
            }
            .script {
              border-left: 2px solid var(--bbvSuccessColor);

              &.ignored {
                border-left: 2px solid var(--bbvErrorColor);
              }
            }
          }

          &.killed {
            .laneTitle {
              color: var(--bbvActiveColor);
            }
            .script {
              border-left: 2px solid var(--bbvActiveColor);
            }
          }
        }
      }

      .script {
        margin: 5px;
        padding: 10px;
        background-color: var(--bbvBoxShadowColor2);
        color: var(--bbvHackerDarkFgColor);
        border-radius: 4px;
        transition: all 0.2s ease;

        &.twoCol {
          display: flex;
          align-items: center;

          .details {
            flex-grow: 1;
          }

          .actions {
            padding: 0;
          }
        }

        &:not(.ignored):hover {
          cursor: pointer;
          background-color: var(--bbvInputBgColor);
        }

        &.ignored {
          ul {
            margin: 0;
            padding-left: 10px;
          }

          code {
            display: inline-block;
            margin-bottom: 4px;
            border-radius: 5px;
            background-color: var(--bbvInputBgColor);
            padding: 1.5px;
          }
        }
      }

      .scriptList-enter-from,
      .scriptList-leave-to {
        opacity: 0;
        transform: translateY(-35px);
      }

      .laneWrap {
        .scriptList-enter-from,
        .scriptList-leave-to {
          opacity: 0;
          transform: translateX(-15px);
        }
      }

      .scriptList-leave-active {
        position: absolute;
      }
    }

    [eye-root] .inspectWin {
      .killBtn {
        font-size: 16px;
        text-transform: uppercase;
        padding: 10px 10px 13px 10px;
        width: 100%;
        animation: bbvFlashBusy 10s ease-in-out 0s infinite alternate;
      }
    }
  `,
}
