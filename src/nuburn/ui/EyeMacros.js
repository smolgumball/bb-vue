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
        operation: '_test',
        options: {
          bounceBack: 'hello there!',
        },
      })
    }
    const runTestBatch = async () => {
      for (let index = 0; index < 250; index++) {
        nuEmit('nuRunner:add', {
          operation: '_test',
          options: {
            bounceBack: 'test #' + index,
          },
        })
        await sleep(Math.random() * 10)
      }
    }

    return {
      macroInputs,
      runHack,
      runGrow,
      runWeaken,
      runTest,
      runTestBatch,
    }
  },
  scss: css`
    .__CMP_NAME__ {
      padding: 1em;
      background-color: var(--bbvHackerDarkBgColor);
      height: 100%;

      & > .other-buttons {
        padding-top: 5px;
        text-align: right;

        & > *:not(:last-child) {
          margin-right: 5px;
        }
      }
    }
  `,
}
