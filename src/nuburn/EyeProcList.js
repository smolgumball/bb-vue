import { css, html, lodash, Vue } from '/bb-vue/lib.js'
import { nuStore } from '/nuburn/lib/getters.js'

export default {
  name: 'eye-proc-list',
  template: html`
    <div class="__CMP_NAME__">
      <div class="horizLane queue">
        <div class="laneTitle">Queue</div>
        <template v-for="proc in lanes.queue" :key="proc.uuid">
          <div class="proc">Queued {{ procFilename(proc) }}</div>
        </template>
      </div>
      <div class="laneWrap">
        <div class="lane running">
          <div class="laneTitle">Running</div>
          <template v-for="proc in lanes.running" :key="proc.uuid">
            <div class="proc">#{{ proc.pid }} - {{ proc.host }} - {{ procFilename(proc) }}</div>
          </template>
        </div>
        <div class="lane successful">
          <div class="laneTitle">Successful</div>
          <template v-for="proc in lanes.successful" :key="proc.uuid">
            <div class="proc">#{{ proc.pid }} - {{ proc.result }}</div>
          </template>
        </div>
        <div class="lane failed">
          <div class="laneTitle">Failed</div>
          <template v-for="proc in lanes.failed" :key="proc.uuid">
            <div class="proc">#{{ proc.pid }} - {{ proc.error }}</div>
          </template>
        </div>
      </div>
    </div>
  `,
  setup() {
    const { computed } = Vue()

    // Store
    const procData = nuStore()
    const lanes = computed(() => {
      return {
        queue: procData?.proc?.queue ?? [],
        running: [...(procData?.proc?.running ?? [])].reverse(),
        successful: [...(procData?.proc?.successful ?? [])].reverse(),
        failed: [...(procData?.proc?.failed ?? [])].reverse(),
      }
    })

    const procFilename = (proc) => {
      return lodash.last(proc.path.split('/'))
    }

    return {
      procData,
      lanes,
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
              --bbvScrollbarBgColor: #0b1420;

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
          min-width: 120px;
          white-space: nowrap;
        }
      }

      .proc {
        margin: 5px;
        padding: 10px;
        background-color: var(--bbvBoxShadowColor2);
        color: var(--bbvHackerDarkFgColor);
        font-weight: bold;
        border-radius: 4px;
      }
    }
  `,
}
