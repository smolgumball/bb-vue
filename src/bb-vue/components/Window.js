// eslint-disable-next-line no-unused-vars
import { nearestConsumerRootMount, html, css } from '/bb-vue/lib.js'
import { WindowStates } from '/bb-vue/components/_resources.js'
import useDraggableWindow from '/bb-vue/components/concerns/useDraggableWindow.js'

export default {
  name: 'bbv-window',
  template: html`
    <div
      ref="thisWindow"
      class="__CMP_NAME__"
      :class="{ isOpen: shouldDisplay }"
      :style="draggable.style"
      @click="bringToFont"
    >
      <div class="window_titlebar" ref="titleBar">
        <div class="window_title">{{ title }}<slot name="title" /></div>
        <div class="window_controls" v-if="canClose">
          <bbv-button v-if="canClose" class="window_close" @click="close">❌</bbv-button>
        </div>
      </div>
      <div class="window_content">
        <slot name="default"></slot>
      </div>
      <div class="window_actions">
        <slot name="actions"></slot>
      </div>
    </div>
  `,
  inject: ['internals'],
  emits: ['window-closed', 'window-opened'],
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
      windowState: WindowStates.closed,
      shouldDisplay: false,
      WindowStates,
    }
  },
  watch: {
    windowState(newVal, oldVal) {
      if (oldVal == WindowStates.closed && newVal == WindowStates.open) {
        // Lag window opens just a bit to ensure CSS transitions are applied
        setTimeout(() => {
          this.shouldDisplay = true
        }, 50)
      } else if (oldVal == WindowStates.open && newVal == WindowStates.closed) {
        this.shouldDisplay = false
      }
    },
  },
  created() {
    this.owner = nearestConsumerRootMount(this)
    this.appTrayConfigDefaults = { show: true, title: this.title }
  },
  mounted() {
    if (this.$props.startOpen) {
      this.windowState = WindowStates.open
    }
    useDraggableWindow(this.draggable, {
      titleBarRef: this.$refs.titleBar,
      draggableRef: this.$refs.thisWindow,
      startPosition: this.$props.startPosition,
      startPositionOffset: this.$props.startPositionOffset,
    })
    this.internals.windowManager.addWindow(this)
  },
  beforeUnmount() {
    this.internals.windowManager.removeWindow(this)
  },
  methods: {
    open() {
      this.windowState = WindowStates.open
      this.$emit('window-opened', this)
    },
    close() {
      if (!this.canClose) return
      this.windowState = WindowStates.closed
      this.$emit('window-closed', this)
    },
    bringToFont() {},
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

      .window_titlebar {
        display: flex;
        flex-grow: 0;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: var(--bbvWindowTitlebarFgColor);
        background-color: var(--bbvWindowTitlebarBgColor);
        border-bottom: 2px solid var(--bbvBorderColor);
        user-select: none;
        cursor: grab;
      }

      .window_title {
        display: flex;
        flex-grow: 1;
        font-weight: bold;
        padding: 7px 15px 5px 15px;
      }

      .window_controls {
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

      .window_close {
        border-radius: 0;
        background-color: var(--bbvWindowActionsBgColor);
      }

      .window_content {
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

      .window_actions {
        display: flex;
        flex-grow: 0;
        justify-content: space-between;
        align-items: center;
        padding: 8px 15px;
        border-top: 2px solid var(--bbvBorderColor);
        background-color: var(--bbvWindowActionsBgColor);
        color: var(--bbvWindowTitlebarFgColor);
        font-size: 12px;
      }
    }
  `,
}
