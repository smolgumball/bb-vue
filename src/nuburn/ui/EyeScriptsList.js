import { css, html, lodash, Vue } from '/bb-vue/lib.js'
import { nuStore } from '/nuburn/lib/globals.js'

export default {
  name: 'eye-scripts-list',
  template: html`
    <div class="__CMP_NAME__">
      <div class="laneWrap">
        <div class="lane active">
          <div class="laneTitle">Active</div>
          <transition-group name="scriptList">
            <template v-for="script in lanes.active" :key="script.pid">
              <div class="script" @click="inspectScript(script.pid)">
                {{ script.server }} #{{ script.pid }}<br />
                {{ scriptFilename(script) }}
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
            style="min-width: 850px"
            :ref="(win) => { if (win) inspectedWins[script.pid] = win }"
            :title="'🎯 PID #' + (script.pid)"
            @close="uninspectScript(script.pid)"
          >
            <bbv-object-display :data="script" />
          </bbv-win>
        </teleport>
      </template>
    </div>
  `,
  setup() {
    const { computed, reactive, ref } = Vue()

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

    return {
      store,
      cmpData,
      lanes,
      inspectedWins,
      inspectedScriptData,
      inspectScript,
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

      & > .laneWrap {
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
        cursor: pointer;

        &:hover {
          background-color: var(--bbvInputBgColor);
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
  `,
}
