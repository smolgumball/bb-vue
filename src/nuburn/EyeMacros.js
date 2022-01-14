import { css, html, Vue } from '/bb-vue/lib.js'
import { nuEmit } from '/nuburn/lib/getters.js'

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
        <bbv-button @click="runTest">Scheduler Test</bbv-button>
      </div>
    </div>
  `,
  setup() {
    const { inject, reactive } = Vue()

    // Store
    const macroInputs = reactive({
      hack: '',
      grow: '',
      weaken: '',
    })

    // Macros
    const runHack = () => {
      nuEmit('nuScheduler:add', {
        path: '/nuburn/exec/h.js',
        options: {
          target: macroInputs.hack,
        },
      })
      macroInputs.hack = ''
    }
    const runGrow = () => {
      nuEmit('nuScheduler:add', {
        path: '/nuburn/exec/g.js',
        options: {
          target: macroInputs.grow,
        },
      })
      macroInputs.grow = ''
    }
    const runWeaken = () => {
      nuEmit('nuScheduler:add', {
        path: '/nuburn/exec/w.js',
        options: {
          target: macroInputs.weaken,
        },
      })
      macroInputs.weaken = ''
    }
    const runTest = () => {
      nuEmit('nuScheduler:add', {
        path: '/nuburn/exec/_test.js',
        options: {
          bounceBack: 'hello there!',
        },
      })
    }

    // Shutdown
    const rootShutdown = inject('rootShutdown')
    const doShutdown = () => {
      rootShutdown()
      nuEmit('nuMain:shutdown')
    }

    return {
      macroInputs,
      runHack,
      runGrow,
      runWeaken,
      runTest,
      doShutdown,
    }
  },
  scss: css`
    .__CMP_NAME__ {
      padding: 1em;
      background-color: var(--bbvHackerDarkBgColor);

      & > .other-buttons {
        padding-top: 10px;
        text-align: right;
      }
    }
  `,
}
