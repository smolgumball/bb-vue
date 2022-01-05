import { css, html } from '/bb-vue/lib.js'
import { WindowStates } from '/bb-vue/components/_resources.js'

export default {
  name: 'bbv-window',
  template: html`
    <dialog class="__CMP_NAME__" v-bind="{ open: windowState == WindowStates.open }">
      <div class="window_titlebar">
        <div class="window_title">{{ title }}<slot name="title" /></div>
        <div class="window_controls" v-if="canMinimize || canClose">
          <bbv-button v-if="canMinimize" icon class="window_minimize" @click="minimize"
            >🔽</bbv-button
          >
          <bbv-button v-if="canClose" icon class="window_close" @click="close">❎</bbv-button>
        </div>
      </div>
      <div class="window_content">
        <slot name="default"></slot>
      </div>
      <div class="window_actions">
        <slot name="actions"></slot>
      </div>
    </dialog>
  `,
  props: {
    title: {
      type: String,
      default: '',
    },
    initialState: {
      type: String,
      default: WindowStates.open,
    },
    canClose: {
      type: Boolean,
      default: false,
    },
    canMinimize: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      WindowStates,
      windowState: WindowStates.closed,

      /* TODO: Wire me up, Scotty */
      offsetPosition: { x: 0, y: 0 },
      stackingIndex: 1,
      isDragging: false,
      isOob: false,

      uuid: null,
    }
  },
  created() {
    this.uuid = crypto.randomUUID()
    if (this.initialState) {
      this.windowState = this.initialState
    }
  },
  mounted() {
    this.$send('window:created', this)
  },
  beforeUnmount() {
    this.windowState = WindowStates.destroyed
    this.$send('window:destroyed', this)
  },
  methods: {
    open() {
      this.windowState = WindowStates.open
    },
    minimize() {
      if (!this.canMinimize) return
      this.windowState = WindowStates.minimized
    },
    close() {
      if (!this.canClose) return
      this.windowState = WindowStates.closed
      this.$send('window:closed', this)
    },
  },
  scss: css`
    .__CMP_NAME__ {
      top: 50vh;
      padding: 0;
      border-radius: 10px;
      overflow: hidden;
      background-color: var(--bbvAppInnerBgColor);
      box-shadow: inset 0px 0px 70px 0px var(--bbvBoxShadowColor1),
        0px 0px 20px 0px var(--bbvBoxShadowColor2);
      border: 2px solid var(--bbvBorderColor);
      transform: translateY(-50%);
      max-width: 400px;

      .window_titlebar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        padding: 5px;
        color: var(--bbvWindowTitlebarFgColor);
        background-color: var(--bbvWindowTitlebarBgColor);
        border-bottom: 2px solid var(--bbvBorderColor);
      }

      .window_title {
        font-weight: bold;
        flex-grow: 1;
        padding-left: 5px;
      }

      .window_controls {
        display: flex;
        justify-content: space-around;
        flex-grow: 0;
      }

      .window_minimize,
      .window_close {
        border-radius: 0;
        background-color: var(--bbvWindowActionsBgColor);
      }

      .window_content {
        padding: 25px 15px;
        color: var(--bbvFontLightColor);

        & > *:first-child {
          margin-top: 0;
          padding-top: 0;
        }
      }

      .window_actions {
        display: flex;
        justify-content: space-between;
        padding: 15px;
        border-top: 2px solid var(--bbvBorderColor);
        background-color: var(--bbvWindowActionsBgColor);
      }
    }
  `,
}