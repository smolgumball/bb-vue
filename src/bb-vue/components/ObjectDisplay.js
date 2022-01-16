// prettier-ignore
import { css, html, lodash, toJson } from '/bb-vue/lib.js'

export default {
  name: 'bbv-object-display',
  template: html`
    <div class="__CMP_NAME__">
      <template v-for="item in objectPrinter" :key="item.label">
        <div class="objectRow">
          <div class="label" :title="item.label">{{ item.label }}</div>
          <div class="value" :title="item.value">{{ item.value }}</div>
        </div>
      </template>
    </div>
  `,
  props: {
    data: {
      default: {
        ezTime: 1642319498647,
        ezTime2: 1642319596738,
        bigNum: 8989810859287482,
        smolNum: 21,
        bigArr: [
          'asflkajlfkasjflkasjflkasjflkasjflaskjfaslfkjaslfkjaslfkasjflkj',
          'lkasjfl',
          4,
          89,
          22,
          10,
        ],
        path: '/nuburn/exec/_test.js',
        host: 'home',
        threads: 1,
        pid: 14,
        uuid: '5f01bd66-44df-4214-96b4-e2d47eff455a',
        options: {
          bounceBack: 'hello there!',
        },
        logs: [],
        timeStart: 1642317178466,
        result: 'hello there! 1661.8602317640846',
        timeEnd: 1642317180215,
        smolArr: [4, 5, 7, 2],
        bigObj: {
          moreStuff: 'poasifpasofiapsof',
          ok: true,
          nice: 'got it',
          arr: [4, 2, 5, 5, 4, 7, 4, 6, 4, 5, 1],
          key: '💛',
        },
      },
    },
  },
  computed: {
    objectPrinter() {
      // Build object array from entries
      let objArray = Object.entries(this.data).map(([label, value]) => {
        const dateTimeMatcher = new RegExp(/.*[tT]ime|[dD]ate.*/, 'gm')
        let type = 'default'
        let subType = 'default'

        // General classification
        if (dateTimeMatcher.exec(label) && lodash.isNumber(value)) type = 'date'
        else if (lodash.isString(value)) type = 'string'
        else if (lodash.isNumber(value)) type = 'number'
        else if (lodash.isArray(value)) type = 'array'
        else if (lodash.isPlainObject(value)) type = 'object'

        // Subtype classification
        if (type == 'array') {
          if (value?.length > 4 || value?.some((x) => x?.length > 50)) {
            subType = 'large'
          }
        } else if (type == 'object') {
          if (Object.keys(value).count > 4 || Object.values(value).some((x) => x?.length > 50)) {
            subType = 'large'
          }
        }

        // Recommended key detection
        // if (label == 'uuid') recommendedKey = 'uuid'
        // else if (label == 'id') recommendedKey = 'id'
        // else if (label == 'pid') recommendedKey = 'pid'
        // else if (label == 'timeStart') recommendedKey = 'timeStart'
        // else recommendedKey = 'shallowHash'
        // key: hash([label, value]),

        return {
          label,
          value,
          type,
          subType,
        }
      })

      // Sort object entries based on known keys + common datatypes
      objArray.sort((a, b) => {
        if (a.label == 'path' && b.label != 'path') return 14
        if (a.label == 'host' && b.label != 'host') return 13
        if (a.label == 'uuid' && b.label != 'uuid') return 12
        if (a.label == 'options' && b.label != 'options') return 11
        if (a.label == 'timeStart' && b.label != 'timeStart') return 10
        if (a.label == 'timeEnd' && b.label != 'timeEnd') return 9
        if (a.label == 'logs' && b.label != 'logs') return 8
        if (a.label == 'result' && b.label != 'result') return 7
        if (a.label == 'error' && b.label != 'error') return 6
        if (a.type == 'date' && b.type != 'date') return -1
        if (a.type == 'string' && b.type != 'string') return -2
        if (a.type == 'number' && b.type != 'number') return -3
        if (a.type == 'array' && b.type != 'array') return -4
        if (a.type == 'object' && b.type != 'object') return -5
        return -6
      })

      return objArray
    },
  },
  methods: { toJson },
  scss: css`
    .__CMP_NAME__ {
      @include bbv-scrollbar;

      width: 100%;
      overflow: auto;

      .objectRow {
        display: flex;
        justify-content: stretch;
        width: 100%;

        &:first-child,
        &:last-child {
          .label,
          .value {
            padding-top: 8px;
            padding-bottom: 8px;
          }
        }
      }

      .label {
        width: 120px;
        padding: 3px 12px 3px 8px;
        border-bottom: 1px solid var(--bbvInputBorderColor);
        flex-shrink: 0;
        overflow: hidden;
        white-space: nowrap;
      }

      .value {
        flex-grow: 1;
        font-size: 12px;
        white-space: pre-wrap;
        word-break: break-all;
        padding: 4px 4px 4px 8px;
        color: var(--bbvHackerDarkFgColor);
        background-color: var(--bbvHackerDarkBgColor);
        border-left: 2px solid var(--bbvInputBorderColor);
      }

      .number {
      }

      .object.large,
      .array.large {
        @include bbv-scrollbar;

        padding: 10px 5px;
        width: 100%;
        max-height: 300px;
        overflow: auto;
        white-space: pre;
        color: var(--bbvHackerDarkFgColor);
        background-color: var(--bbvHackerDarkBgColor);
        border-radius: 5px;
      }
    }
  `,
}
