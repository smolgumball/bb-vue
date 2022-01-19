import { css, html, lodash, Vue } from '/bb-vue/lib.js'
import { nuStore } from '/nuburn/lib/globals.js'

export default {
  name: 'eye-runner-list',
  template: html`
    <div class="__CMP_NAME__">
      <div class="horizLane queue">
        <div class="laneTitle">Queue</div>
        <transition-group name="procList">
          <template v-for="proc in lanes.queue" :key="proc.uuid">
            <div class="proc" @click="inspectProc(proc)">{{ procFilename(proc) }}</div>
          </template>
        </transition-group>
      </div>
      <div class="laneWrap">
        <div class="lane running">
          <div class="laneTitle">Running</div>
          <transition-group name="procList">
            <template v-for="proc in lanes.running" :key="proc.uuid">
              <div class="proc" @click="inspectProc(proc)">
                #{{ proc.pid }} - {{ proc.host }} - {{ procFilename(proc) }}
              </div>
            </template>
          </transition-group>
        </div>
        <div class="lane successful">
          <div class="laneTitle">Successful</div>
          <transition-group name="procList">
            <template v-for="proc in lanes.successful" :key="proc.uuid">
              <div class="proc" @click="inspectProc(proc)">#{{ proc.pid }} - {{ proc.result }}</div>
            </template>
          </transition-group>
        </div>
        <div class="lane failed">
          <div class="laneTitle">Failed & Phantom</div>
          <transition-group name="procList">
            <template v-for="proc in lanes.failedPhantom" :key="proc.uuid">
              <div class="proc" @click="inspectProc(proc)">#{{ proc.pid }} - {{ proc.error }}</div>
            </template>
          </transition-group>
        </div>
      </div>
      <template v-for="proc in inspectedProcData" :key="proc.uuid">
        <bbv-win
          no-pad
          :title="'🐞 Proc #' + (proc.pid)"
          @open="inspectProc(proc)"
          @close="uninspectProc(proc)"
        >
          <!-- <bbv-json-display fill wrap :data="proc" /> -->
          <bbv-object-display :data="proc" />
        </bbv-win>
      </template>
    </div>
  `,
  setup() {
    const { computed, reactive } = Vue()

    // Stores
    const store = nuStore()

    /** @type {{ inspectedProcUuids: string[] }} */
    const cmpData = reactive({
      inspectedProcUuids: [],
    })

    // Computed
    const lanes = computed(() => {
      return {
        queue: store?.proc?.queue ?? [],
        running: [...(store?.proc?.running ?? [])].reverse(),
        successful: [...(store?.proc?.successful ?? [])].reverse(),
        failedPhantom: [
          ...[...(store?.proc?.failed ?? [])].reverse(),
          ...[...(store?.proc?.phantom ?? [])].reverse(),
        ],
      }
    })
    const inspectedProcData = computed(() => {
      return cmpData.inspectedProcUuids.map((uuid) => store.proc.all.find((y) => y.uuid == uuid))
    })

    // Methods
    const procFilename = (proc) => {
      return lodash.last(proc.path.split('/'))
    }
    const inspectProc = (proc) => {
      if (cmpData.inspectedProcUuids.find((x) => x == proc.uuid)) return
      cmpData.inspectedProcUuids.push(proc.uuid)
    }
    const uninspectProc = (proc) => {
      cmpData.inspectedProcUuids = lodash.without(cmpData.inspectedProcUuids, proc.uuid)
    }

    return {
      store,
      cmpData,
      inspectedProcData,
      lanes,
      inspectProc,
      uninspectProc,
      procFilename,
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
        height: calc(100% - 56px);

        .lane {
          @include bbv-scrollbar;

          position: relative;
          width: 32.8%;
          height: 100%;
          overflow-y: scroll;
          background-color: var(--bbvBoxShadowColor1);
          padding-top: 25px;

          &.running {
            .laneTitle {
              color: var(--bbvActiveColor);
            }
            .proc {
              border-left: 2px solid var(--bbvActiveColor);
            }
          }

          &.successful {
            .laneTitle {
              color: var(--bbvSuccessColor);
            }
            .proc {
              border-left: 2px solid var(--bbvSuccessColor);
            }
          }

          &.failed {
            .laneTitle {
              color: var(--bbvErrorColor);
            }
            .proc {
              --bbvScrollbarFgColor: var(--bbvErrorColor);
              --bbvScrollbarBgColor: var(--bbvErrorDarkColor);

              @include bbv-scrollbar($height: 8px);

              overflow: auto;
              border-left: 2px solid var(--bbvErrorColor);
              margin-bottom: 10px;
            }
          }
        }
      }

      & > .horizLane {
        @include bbv-scrollbar;

        position: relative;
        display: flex;
        height: 50px;
        background-color: var(--bbvBoxShadowColor1);
        overflow: auto;

        .proc {
          min-width: max-content;
          white-space: nowrap;
          overflow: hidden;
        }
      }

      .proc {
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

      .procList-enter-from,
      .procList-leave-to {
        opacity: 0;
        transform: translateY(-35px);
      }

      .laneWrap {
        .procList-enter-from,
        .procList-leave-to {
          opacity: 0;
          transform: translateX(-15px);
        }
      }

      .procList-leave-active {
        position: absolute;
      }
    }
  `,
}
