// prettier-ignore
import { cleanupError, css, html, lodash, timeDiff, toJson } from '/bb-vue/lib.js'

export const formatRam = (gb) => {
  const sizes = ['GB', 'TB', 'PB']
  const marker = 1000
  const precision = 2
  gb = parseInt(gb) || 0
  if (gb == 0) return 'n/a'
  const i = parseInt(Math.floor(Math.log(gb) / Math.log(marker)))
  if (i == 0) return gb + sizes[i]
  return (gb / Math.pow(marker, i)).toFixed(precision) + sizes[i]
}

export const mapOrder = (array, myorder, key, catchAll) => {
  var order = myorder.reduce((r, k, i) => ((r[k] = i + 1), r), {})
  const theSort = array.sort(
    (a, b) => (order[a[key]] || order[catchAll]) - (order[b[key]] || order[catchAll])
  )
  return theSort
}

export default {
  name: 'bbv-object-display',
  template: html`
    <div class="__CMP_NAME__">
      <template v-for="item in objectPrinter">
        <div class="objectRow">
          <div class="label" :title="item.label">{{ item.label }}</div>
          <div class="value">
            <template v-if="item.subType == 'logs'">
              <bbv-log-display :data="item.value" />
            </template>
            <template v-else>{{ item.value }}</template>
          </div>
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
      if (!lodash.isObjectLike(this.data)) return

      const dateTimeMatcher = new RegExp(/.*[tT]ime|[dD]ate.*/, 'gm')
      const ramLikes = ['ram', 'ramUsed', 'ramUsage', 'ramTotal', 'ramFree', 'ramAvail']
      const secondLikes = ['onlineRunningTime', 'offlineRunningTime', 'timeLifespan']
      const dateLikes = ['timeOfBirth', 'timeOfDeath']

      // Build object array from entries
      let objArray = Object.entries({ ...this.data }).map(([label, value]) => {
        label = String(label).trim()
        let valueOfflimits = false

        let type = 'default'
        let subType = 'default'

        // General classification
        if ((dateTimeMatcher['exec'](label) || dateLikes.includes(label)) && lodash.isNumber(value))
          type = 'date'
        else if (lodash.isString(value)) type = 'string'
        else if (lodash.isNumber(value)) type = 'number'
        else if (lodash.isArray(value)) type = 'array'
        else if (lodash.isPlainObject(value)) type = 'object'

        // Subtype classification
        if (type == 'array') {
          if (label.toLowerCase() == 'logs') {
            subType = 'logs'
          } else if (value?.length > 4 || value?.some((x) => x?.length > 50)) {
            subType = 'large'
          }
        } else if (type == 'object') {
          if (Object.keys(value).count > 4 || Object.values(value).some((x) => x?.length > 50)) {
            subType = 'large'
          }
        }

        // Basic processing
        if (type == 'string') value = value.trim()
        if (type == 'string' && label == 'error') value = cleanupError(value)

        // Time processing
        if (['string', 'number', 'date'].includes(type) && ramLikes.includes(label)) {
          value = formatRam(value)
          valueOfflimits = true
        }

        if (
          ['string', 'number', 'date'].includes(type) &&
          secondLikes.includes(label) &&
          !valueOfflimits
        ) {
          value = timeDiff(value)
          valueOfflimits = true
        }

        // Date display
        if (type == 'date' && !valueOfflimits) {
          try {
            value = new Date(value).toLocaleTimeString()
          } catch (error) {
            /* shh */
          }
        }

        return {
          label,
          value,
          type,
          subType,
        }
      })

      // Sort object entries based on known keys + common datatypes
      let labelOrders = [
        'server',
        'filename',
        'args',
        'pid',
        'threads',
        ...ramLikes,
        ...secondLikes,
        ...dateLikes,
        'status',
        'result',
        'error',
        'onlineMoneyMade',
        'onlineExpGained',
        'script',
        'path',
        'host',
        'uuid',
        'options',
        '*',
        'logs',
      ]

      return mapOrder(objArray, labelOrders, 'label', '*')
    },
  },
  methods: { toJson, cleanupError },
  scss: css`
    .__CMP_NAME__ {
      @include bbv-scrollbar;

      width: 100%;
      overflow: auto;
      box-shadow: 0px 0px 10px 0px var(--bbvBoxShadowColor1);

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

        &:last-child {
          .label {
            border-color: transparent;
          }
        }
      }

      .label {
        width: 20%;
        min-width: 120px;
        max-width: 220px;
        padding: 3px 12px 3px 8px;
        border-bottom: 1px solid var(--bbvInputBorderFadeColor);
        flex-shrink: 0;
        overflow: hidden;
        text-overflow: ellipsis;
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
        border-left: 2px solid var(--bbvInputBorderFadeColor);
      }
    }
  `,
}
