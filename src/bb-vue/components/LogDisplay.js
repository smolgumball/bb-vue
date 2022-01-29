// prettier-ignore
import { css, html, isBlank, lodash } from '/bb-vue/lib.js'

export default {
  name: 'bbv-log-display',
  template: html`
    <div class="__CMP_NAME__">
      <template v-for="[logTs, tsRows] in logsMap" :key="logTs">
        <div class="tsRow" :class='{ hasTs: logTs !== "noTs" }'>
          <div class="logTs" v-if="logTs !== 'noTs'">{{ logTs }}</div>
          <div class="simpleRows">
            <template v-for="row in tsRows" :key="row">
              <div class="simpleRow">{{ row }}</div>
            </template>
          </div>
        </div>
      </template>
    </div>
  `,
  props: {
    data: {
      default: () => [],
    },
  },
  computed: {
    logsMap() {
      if (!lodash.isArray(this.data)) return

      // Build object array from entries
      let mergedLogs = new Map()
      this.data.forEach((logRow) => {
        logRow = String(logRow)
        let logTs = Array.from(logRow.matchAll(/\[(.*?)\]/g))
        if (!isBlank(logTs) && lodash['get'](logTs, '[0][1]')) {
          let tsMatch = logTs[0][0]
          logTs = logTs[0][1]
          logRow = logRow.replaceAll(tsMatch, '')
        } else {
          logTs = 'noTs'
        }
        let existingLogs = mergedLogs['get'](logTs) || []
        mergedLogs.set(logTs, [...existingLogs, logRow.trim()])
      })

      return new Map(Array.from(mergedLogs).reverse())
    },
  },
  scss: css`
    .__CMP_NAME__ {
      width: 100%;

      .tsRow {
        display: flex;
        align-items: flex-start;
        width: 100%;
        padding: 3px 0;

        &.hasTs .simpleRow {
          padding: 0 8px;
        }
      }

      .logTs {
        padding: 1.5px;
        border-radius: 5px;
        background-color: var(--bbvInputBorderFadeColor);
        width: max-content;
        white-space: nowrap;
      }

      .simpleRows {
        flex-grow: 1;
      }

      .simpleRow {
        line-height: 14px;
      }
    }
  `,
}
