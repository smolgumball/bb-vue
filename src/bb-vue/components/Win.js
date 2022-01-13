// prettier-ignore
import { getClosestCrm, html, css } from '/bb-vue/lib.js'

// prettier-ignore
import { WinStates } from '/bb-vue/components/_resources.js'
import useDraggableWin from '/bb-vue/components/concerns/useDraggableWin.js'

export default {
  name: 'bbv-win',
  template: html`
    <div
      ref="thisWin"
      class="__CMP_NAME__"
      :class="{ shouldDisplay, isDragging }"
      :style="style"
      @pointerdown="bringToFront"
      @keydown.stop
    >
      <div class="win_titlebar" ref="dragHandle">
        <div class="win_title">{{ title }}<slot name="title" /></div>
        <template v-if="canClose">
          <div class="win_controls" ref="dragIgnore">
            <bbv-button class="win_close" @click="close">❎</bbv-button>
          </div>
        </template>
      </div>
      <div class="win_content" :class="{ noPad: noPad !== false }">
        <slot name="default"></slot>
      </div>
      <div class="win_actions">
        <slot name="actions"></slot>
      </div>
      <!-- Hack to disable selection on other parts of document while dragging windows -->
      <template v-if="isDragging">
        <component is="style" type="text/css"> body *::selection { all: inherit; } </component>
      </template>
    </div>
  `,
  inject: ['internals'],
  emits: ['open', 'close'],
  props: {
    title: {
      type: String,
      default: '',
    },
    startOpen: {
      type: Boolean,
      default: true,
    },
    startPosition: {
      type: Object,
    },
    startWidth: {
      type: String,
    },
    startHeight: {
      type: String,
    },
    canClose: {
      type: Boolean,
      default: true,
    },
    noPad: {
      default: false,
    },
    trayHide: {
      type: Boolean,
      default: false,
    },
    trayTitle: {
      type: String,
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
    async winState(newVal, oldVal) {
      if (newVal == WinStates.open && oldVal == WinStates.closed) {
        // Lag win opens just a bit to ensure CSS transitions are applied
        await this.$nextTick()
        this.shouldDisplay = true
        this.bringToFront()
      } else if (newVal == WinStates.closed) {
        this.shouldDisplay = false
      }
    },
  },
  computed: {
    style() {
      return {
        width: this.$props.startWidth,
        height: this.$props.startHeight,
        ...this.draggable.style,
        zIndex: this.stackingIndex,
      }
    },
    isDragging() {
      return this.draggable.isDragging
    },
  },
  created() {
    this.owner = getClosestCrm(this)
  },
  async mounted() {
    const winManager = this.internals.winManager
    winManager.addWin(this)

    useDraggableWin(this.draggable, {
      winManager: winManager,
      dragHandleRef: this.$refs.dragHandle,
      dragIgnoreRef: this.$refs.dragIgnore,
      draggableRef: this.$refs.thisWin,
      startPosition: this.$props.startPosition,
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
      if (this.winState == WinStates.open) return
      this.winState = WinStates.open
      this.$emit('open', this)
    },
    close() {
      if (this.winState == WinStates.closed) return
      this.winState = WinStates.closed
      this.$emit('close', this)
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

      resize: both;
      min-width: 250px;
      min-height: 250px;

      overflow: hidden;
      border: 2px solid var(--bbvBorderColor);
      border-radius: 10px;

      background-color: var(--bbvAppInnerBgColor);
      box-shadow: inset 0px 0px 70px 0px var(--bbvBoxShadowColor1),
        0px 0px 20px 0px var(--bbvBoxShadowColor2);

      transition: opacity 0.2s ease-out, transform 0.2s ease-out;

      &:not(.shouldDisplay) {
        opacity: 0;
        pointer-events: none;
        transform: translateY(25px);
      }

      &.isDragging {
        opacity: 0.9;
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
        padding: 7px 15px 5px 7px;
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
            margin-right: 6px;
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

        &.noPad {
          padding: 0;
        }

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
