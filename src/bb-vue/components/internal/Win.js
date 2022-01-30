// prettier-ignore
import { getClosestCrm, html, css, sleep } from '/bb-vue/lib.js'

// prettier-ignore
import { WinStates } from '/bb-vue/components/internal/_resources.js'
import useDraggableWin from '/bb-vue/components/concerns/useDraggableWin.js'

export default {
  name: 'bbv-win',
  template: html`
    <div
      ref="thisWin"
      class="__CMP_NAME__"
      :class="{ shouldDisplay, isDragging, isCollapsed: draggable.isCollapsed }"
      :style="style"
      @pointerdown="bringToFront"
      @dblclick="() => canCollapse && toggleCollapse()"
      @keydown.stop
    >
      <div class="win_titlebar" ref="dragHandle">
        <div class="win_title">{{ title }}<slot name="title" /></div>
        <template v-if="canClose || canCollapse">
          <div class="win_controls" ref="winControls">
            <bbv-button class="win_collapse" @click="toggleCollapse">
              <span v-if="draggable.isCollapsed">🔽</span>
              <span v-else>🔼</span>
            </bbv-button>
            <bbv-button class="win_close" @click="close">❎</bbv-button>
          </div>
        </template>
      </div>
      <div class="win_content" :class="{ noPad: noPad !== false, noScroll: noScroll !== false }">
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
  emits: ['open', 'close', 'collapse'],
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
    canCollapse: {
      type: Boolean,
      default: true,
    },
    noPad: {
      default: false,
    },
    noScroll: {
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
      draggable: {
        savedHeight: 0,
        isCollapsed: false,
      },
      stackingIndex: 1,
      winState: WinStates.closed,
      shouldDisplay: false,
      hasOpened: false,
      WinStates,
    }
  },
  watch: {
    async winState(newVal, oldVal) {
      if (newVal == WinStates.open && oldVal == WinStates.closed) {
        // Position window on first open
        if (this.hasOpened === false) {
          this.hasOpened = true
          useDraggableWin(this.draggable, {
            win: this,
            winManager: this.internals.winManager,
            dragHandleRef: this.$refs.dragHandle,
            dragIgnoreRef: this.$refs.winControls,
            draggableRef: this.$refs.thisWin,
            startPosition: this.$props.startPosition,
          })
        }

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
      const collapsedOverrides = {
        ...this.draggable.style,
        height: 'auto',
        minWidth: undefined,
        minHeight: undefined,
      }

      let draggableStyles = this.draggable.isCollapsed ? collapsedOverrides : this.draggable.style
      if (this.draggable.savedHeight !== 0 && !this.draggable.isCollapsed) {
        draggableStyles.height = this.draggable.savedHeight
        this.draggable.savedHeight = 0
      }

      return {
        width: this.$props.startWidth,
        height: this.$props.startHeight,
        zIndex: this.stackingIndex,
        ...draggableStyles,
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
    this.internals.winManager.addWin(this)
    if (this.$props.startOpen) {
      this.winState = WinStates.open
    }
  },
  beforeUnmount() {
    this.internals.winManager.removeWin(this)
  },
  methods: {
    async open() {
      if (this.winState == WinStates.open) return
      this.winState = WinStates.open
      await sleep(200)
      this.$emit('open', { winMount: this, winState: this.winState })
    },
    async close() {
      if (this.winState == WinStates.closed) return
      this.winState = WinStates.closed
      await sleep(200)
      this.$emit('close', { winMount: this, winState: this.winState })
    },
    toggleCollapse() {
      if (this.draggable.isCollapsed === false) {
        this.draggable.savedHeight = this.draggable.style.height
      }
      this.draggable.isCollapsed = !this.draggable.isCollapsed
      this.$emit('collapse', { winMount: this, isCollapsed: this.draggable.isCollapsed })
    },
    bringToFront(event) {
      if (event && event.path.some((x) => x == this.$refs.winControls)) return
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

      transition: opacity 0.1s ease-out;

      &:not(.shouldDisplay) {
        opacity: 0;
        pointer-events: none;
      }

      &.isDragging {
        opacity: 0.8;
      }

      &.isCollapsed {
        min-height: 0;
        resize: none;

        .win_content {
          display: none;
        }

        .win_actions {
          background-color: var(--bbvBoxShadowColor1);
        }
      }

      .win_titlebar {
        display: flex;
        flex-grow: 0;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: var(--bbvWinTitlebarFgColor);
        background-color: var(--bbvWinTitlebarBgColor);
        user-select: none;
        cursor: grab;
      }

      .win_title {
        display: flex;
        flex-grow: 1;
        padding: 3px 15px 3px 7px;
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
          border-radius: 0;
          background-color: var(--bbvWinActionsBgColor);

          &:last-child {
            margin-right: 6px;
          }
        }
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

        &:not(.noPad) > *:first-child {
          margin-top: 0;
          padding-top: 0;
        }

        &.noScroll {
          overflow: hidden;
        }
      }

      .win_actions {
        display: flex;
        flex-grow: 0;
        justify-content: space-between;
        align-items: center;
        padding: 8px 15px;
        background-color: var(--bbvWinActionsBgColor);
        color: var(--bbvWinTitlebarFgColor);
        font-size: 12px;

        &:empty {
          display: none;
        }
      }
    }
  `,
}
