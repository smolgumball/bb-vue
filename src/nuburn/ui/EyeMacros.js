import { css, html, sleep, Vue } from '/bb-vue/lib.js'
import { nuEmit } from '/nuburn/lib/globals.js'

export default {
  name: 'eye-macros',
  template: html`
    <div class="__CMP_NAME__">
      <eye-input
        label="Target"
        label-button="Hack"
        v-model="macroInputs.hack"
        @activate="runHack"
      />
      <eye-input
        label="Target"
        label-button="Grow"
        v-model="macroInputs.grow"
        @activate="runGrow"
      />
      <eye-input
        label="Target"
        label-button="Weaken"
        v-model="macroInputs.weaken"
        @activate="runWeaken"
      />
      <div class="other-buttons">
        <bbv-button @click="runTest">Runner Test</bbv-button>
        <bbv-button @click="runTestBatch">Test <code>Batch</code></bbv-button>
        <bbv-button @click="noodleBomb">n00dle Bomb</bbv-button>
        <bbv-button @click="shareTheLove">sHaRe ThE 💚</bbv-button>
      </div>
    </div>
  `,
  setup() {
    const { reactive } = Vue()

    // Store
    const macroInputs = reactive({
      hack: '',
      grow: '',
      weaken: '',
    })

    // Macros
    const runHack = () => {
      nuEmit('nuRunner:add', {
        operation: 'h',
        options: {
          target: macroInputs.hack,
        },
      })
    }
    const runGrow = () => {
      nuEmit('nuRunner:add', {
        operation: 'g',
        options: {
          target: macroInputs.grow,
        },
      })
    }
    const runWeaken = () => {
      nuEmit('nuRunner:add', {
        operation: 'w',
        options: {
          target: macroInputs.weaken,
        },
      })
    }
    const runTest = () => {
      nuEmit('nuRunner:add', {
        operation: 'test',
        options: {
          bounceBack: 'hello there!',
        },
      })
    }
    const runTestBatch = async () => {
      for (let index = 0; index < 250; index++) {
        nuEmit('nuRunner:add', {
          operation: 'test',
          options: {
            bounceBack: '👋',
          },
        })
        await sleep(Math.random() * 10)
      }
    }
    const noodleBomb = async () => {
      for (let index = 0; index < 10000; index++) {
        nuEmit('nuRunner:add', {
          operation: 'w',
          threads: 25000,
          options: {
            target: 'n00dles',
          },
        })
        nuEmit('nuRunner:add', {
          operation: 'g',
          threads: 25000,
          options: {
            target: 'n00dles',
          },
        })
        nuEmit('nuRunner:add', {
          operation: 'h',
          threads: 50000,
          options: {
            target: 'n00dles',
          },
        })
        await sleep(Math.random() * 50)
      }
    }
    const shareTheLove = async () => {
      for (let index = 0; index < 45; index++) {
        await sleep(Math.random() * 15)
        nuEmit('nuRunner:add', {
          operation: 'share',
          threads: 125,
          options: {},
        })
        /* await sleep(Math.random() * 15)
        nuEmit('nuRunner:add', {
          operation: 'g',
          threads: 50000,
          options: {
            target: 'n00dles',
          },
        })
        await sleep(Math.random() * 15)
        nuEmit('nuRunner:add', {
          operation: 'w',
          threads: 50000,
          options: {
            target: 'n00dles',
          },
        }) */
      }
    }

    return {
      macroInputs,
      runHack,
      runGrow,
      runWeaken,
      runTest,
      runTestBatch,
      noodleBomb,
      shareTheLove,
    }
  },
  scss: css`
    .__CMP_NAME__ {
      padding: 1em;
      background-color: var(--bbvHackerDarkBgColor);
      height: 100%;

      & > .other-buttons {
        text-align: right;
        margin-right: -5px;

        & > * {
          margin: 5px;
        }
      }
    }
  `,
}
