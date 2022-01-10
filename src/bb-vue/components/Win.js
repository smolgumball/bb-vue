import { nearestConsumerRootMount, html, css } from '/bb-vue/lib.js'
import { WinStates } from '/bb-vue/components/_resources.js'
import useDraggableWin from '/bb-vue/components/concerns/useDraggableWin.js'

export default {
  name: 'bbv-win',
  template: html`
    <div
      ref="thisWin"
      class="__CMP_NAME__"
      :class="{ isOpen: shouldDisplay }"
      :style="windowStyle"
      @pointerdown="bringToFront"
    >
      <div class="win_titlebar" ref="titleBar">
        <div class="win_title">{{ title }}<slot name="title" /></div>
        <div class="win_controls" v-if="canClose">
          <bbv-button v-if="canClose" class="win_close" @click="close">❌</bbv-button>
        </div>
      </div>
      <div class="win_content">
        <slot name="default"></slot>
      </div>
      <div class="win_actions">
        <slot name="actions"></slot>
      </div>
    </div>
  `,
  inject: ['internals'],
  emits: ['win-closed', 'win-opened'],
  props: {
    title: {
      type: String,
      default: '',
    },
    startOpen: {
      type: Boolean,
      default: true,
    },
    canClose: {
      type: Boolean,
      default: true,
    },
    startPosition: {
      type: Object,
    },
    startPositionOffset: {
      type: Object,
    },
    appTrayConfig: {
      type: Object,
      default: () => new Object(),
    },
  },
  data() {
    return {
      uuid: crypto.randomUUID(),
      owner: null,
      draggable: {},
      stackingIndex: 1,
      winState: WinStates.closed,
      shouldDisplay: false,
      WinStates,
    }
  },
  watch: {
    winState(newVal, oldVal) {
      if (oldVal == WinStates.closed && newVal == WinStates.open) {
        // Lag win opens just a bit to ensure CSS transitions are applied
        setTimeout(() => {
          this.shouldDisplay = true
        }, 50)
      } else if (oldVal == WinStates.open && newVal == WinStates.closed) {
        this.shouldDisplay = false
      }
    },
  },
  computed: {
    windowStyle() {
      return {
        ...this.draggable.style,
        zIndex: this.stackingIndex,
      }
    },
  },
  created() {
    this.owner = nearestConsumerRootMount(this)
    this.appTrayConfigDefaults = { show: true, title: this.title }
  },
  mounted() {
    const winManager = this.internals.winManager
    winManager.addWin(this)

    let startPosition = this.$props.startPosition ?? winManager.getRecommendedPosition(this)
    let startPositionOffset = this.$props.startPositionOffset

    useDraggableWin(this.draggable, {
      titleBarRef: this.$refs.titleBar,
      draggableRef: this.$refs.thisWin,
      startPosition,
      startPositionOffset,
    })

    if (this.$props.startOpen) {
      this.winState = WinStates.open
    }
  },
  beforeUnmount() {
    this.internals.winManager.removeWin(this)
  },
  methods: {
    open() {
      this.winState = WinStates.open
      this.$emit('win-opened', this)
      this.bringToFront()
    },
    close() {
      if (!this.canClose) return
      this.winState = WinStates.closed
      this.$emit('win-closed', this)
    },
    bringToFront() {
      this.internals.winManager.bringToFront(this)
    },
  },
  scss: css`
    .__CMP_NAME__ {
      position: fixed;
      z-index: 1500;

      display: flex;
      flex-direction: column;
      min-width: 250px;
      min-height: 250px;

      resize: both;
      overflow: hidden;
      border: 2px solid var(--bbvBorderColor);
      border-radius: 10px;

      background-color: var(--bbvAppInnerBgColor);
      box-shadow: inset 0px 0px 70px 0px var(--bbvBoxShadowColor1),
        0px 0px 20px 0px var(--bbvBoxShadowColor2);

      transition: opacity 0.4s ease, transform 0.4s ease;

      &:not(.isOpen) {
        opacity: 0;
        pointer-events: none;
        transform: translateY(25px);
      }

      .win_titlebar {
        display: flex;
        flex-grow: 0;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: var(--bbvWinTitlebarFgColor);
        background-color: var(--bbvWinTitlebarBgColor);
        border-bottom: 2px solid var(--bbvBorderColor);
        user-select: none;
        cursor: grab;
      }

      .win_title {
        display: flex;
        flex-grow: 1;
        font-weight: bold;
        padding: 7px 15px 5px 15px;
      }

      .win_controls {
        display: flex;
        justify-content: space-around;
        flex-grow: 0;
        font-size: 14px;
        cursor: auto;

        .bbv-button {
          margin: 3px;
          padding: 2px;
          padding-bottom: 4px;
          border-radius: 5px;

          &:last-child {
            margin-right: 12px;
          }
        }
      }

      .win_close {
        border-radius: 0;
        background-color: var(--bbvWinActionsBgColor);
      }

      .win_content {
        @include bbv-scrollbar;

        padding: 25px 15px;
        flex-grow: 1;
        overflow-y: auto;
        color: var(--bbvFontLightColor);

        & > *:first-child {
          margin-top: 0;
          padding-top: 0;
        }
      }

      .win_actions {
        display: flex;
        flex-grow: 0;
        justify-content: space-between;
        align-items: center;
        padding: 8px 15px;
        border-top: 2px solid var(--bbvBorderColor);
        background-color: var(--bbvWinActionsBgColor);
        color: var(--bbvWinTitlebarFgColor);
        font-size: 12px;
      }
    }
  `,
}
