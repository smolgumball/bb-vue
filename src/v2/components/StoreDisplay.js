import { toJson, css, html, projectGlobals, lodash } from '/v2/lib.js'

export default {
  name: 'store-display',
  style: css`
    .store_display {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      margin-bottom: 15px;

      .key_display {
        margin-bottom: 1em;
        width: 50%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        &:nth-child(2n) {
          width: calc(50% - 1em);
          margin-left: 1em;
        }

        h3 {
          margin-left: 0.4em;
        }
      }

      .generic_display {
        height: var(--sglCardHeight);
      }

      .script_info {
        padding-top: 0;
      }

      .script_info_record {
        padding: 0.8em;
        margin: 0 -0.8em;
        white-space: pre;

        &:nth-child(2n) {
          background-color: fade-out(#002b36, 0.5);
        }
      }
    }
  `,
  template: html`
    <div class="store_display">
      <div class="key_display">
        <h3>recentEvents</h3>
        <recent-events />
      </div>
      <div class="key_display">
        <h3>scriptInfo</h3>
        <div class="script_info generic_display sgl--json_display">
          <!-- prettier-ignore -->
          <div class="script_info_record" v-for="script in store.scriptInfo" :key="script.pid">{{ prepScriptInfo(script) }}</div>
        </div>
      </div>
      <div class="key_display" v-for="(val, key) in genericStores" :key="key">
        <h3>{{ key }}</h3>
        <div class="generic_display sgl--json_display">{{ toJson(val) }}</div>
      </div>
    </div>
  `,
  data() {
    return {}
  },
  computed: {
    store() {
      return projectGlobals.store.data
    },
    genericStores() {
      return {
        ...lodash.pick(this.store, ['playerInfo', 'homeInfo']),
      }
    },
  },
  methods: {
    toJson,
    prepScriptInfo(scriptInfo) {
      let toRet = ''
      let scriptDetails = { ...scriptInfo, logs: undefined }
      toRet += `${scriptInfo.filename} { threads: ${scriptInfo.threads}, pid: ${scriptInfo.pid} }\n`
      toRet += `${this.toJson(scriptDetails)}\n`
      return toRet
    },
  },
}
