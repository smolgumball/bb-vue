import { css, html, lodash, Vue } from '/bb-vue/lib.js'
import { nuStore } from '/nuburn/lib/getters.js'

export default {
  name: 'eye-proc-list',
  template: html`
    <div class="__CMP_NAME__">
      <div class="horizLane queue">
        <template v-for="proc in lanes.queue" :key="proc.uuid">
          <div class="proc">Queued {{ procFilename(proc) }}</div>
        </template>
      </div>
      <div class="laneWrap">
        <div class="lane running">
          <template v-for="proc in lanes.running" :key="proc.uuid">
            <div class="proc">#{{ proc.pid }} - {{ proc.host }} - {{ procFilename(proc) }}</div>
          </template>
        </div>
        <div class="lane successful">
          <template v-for="proc in lanes.successful" :key="proc.uuid">
            <div class="proc">#{{ proc.pid }} - {{ proc.result }}</div>
          </template>
        </div>
        <div class="lane failed">
          <template v-for="proc in lanes.failed" :key="proc.uuid">
            <div class="proc">#{{ proc.pid }} - {{ proc.error }}</div>
          </template>
        </div>
      </div>
    </div>
  `,
  setup() {
    const { computed, reactive } = Vue()

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

      & > .laneWrap {
        display: flex;
        justify-content: space-between;
        width: 100%;
        height: calc(100% - 60px);

        .lane {
          @include bbv-scrollbar;

          width: 32.5%;
          height: 100%;
          overflow-y: scroll;
          background-color: var(--bbvBoxShadowColor1);
        }
      }

      & > .horizLane {
        display: flex;
        height: 50px;
        background-color: var(--bbvBoxShadowColor1);

        .proc {
          flex-grow: 0;
        }
      }

      .proc {
        margin: 5px;
        padding: 10px;
        background-color: var(--bbvHackerDarkAltBgColor);
        color: var(--bbvAppTrayFgColor);
        border-radius: 4px;
      }
    }
  `,
}
