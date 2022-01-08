import { css, getGlobal, html, lodash } from '/bb-vue/lib.js'

import ConsumerRoot from '/bb-vue/components/internal/ConsumerRoot.js'
import StylesheetManager from '/bb-vue/components/internal/StylesheetManager.js'

import Window from '/bb-vue/components/Window.js'
import WindowManager from '/bb-vue/components/WindowManager.js'
import AppTray from '/bb-vue/components/AppTray.js'
import AppTrayGroup from '/bb-vue/components/AppTrayGroup.js'
import Button from '/bb-vue/components/Button.js'
import JsonDisplay from '/bb-vue/components/JsonDisplay.js'
import Tabs from '/bb-vue/components/Tabs.js'

export const ComponentLibrary = [
  ConsumerRoot,
  StylesheetManager,
  Window,
  WindowManager,
  AppTray,
  AppTrayGroup,
  Button,
  JsonDisplay,
  Tabs,
]

export default {
  __libraryRoot: true,
  name: 'bbv-app-root',
  template: html`
    <transition name="rootAppIntro" appear>
      <main class="__CMP_NAME__" bbv-container v-if="depsLoaded">
        <transition-group name="consumerAppIntro" appear>
          <bbv-consumer-root
            v-for="app in consumerRootDefs"
            :key="app.__name"
            :id="app.__name"
            :consumer-root-def="app"
            @consumer-root-shutdown="onConsumerRootShutdown"
            @consumer-root-mounted="onConsumerRootMounted"
          />
        </transition-group>
        <bbv-stylesheet-manager :consumer-root-defs="consumerRootDefs" />
        <bbv-window-manager />
        <bbv-app-tray />
      </main>
    </transition>
  `,
  data() {
    const Mitt = getGlobal('Mitt')
    let bus = Mitt.createBus()

    return {
      depsLoaded: false,
      internals: {
        bus: bus,
        send: bus.emit,
        listen: bus.on,
        windowManager: null,
        store: {
          consumerRootDefs: [],
          consumerRootMounts: [],
          windowMounts: [],
        },
      },
    }
  },
  created() {
    this.loadDeps()
  },
  provide() {
    return this.$data
  },
  computed: {
    consumerRootDefs() {
      return this.internals.store.consumerRootDefs
    },
  },
  methods: {
    async loadDeps() {
      if (!getGlobal('VueUse')) {
        // console.time('AppRoot:loadDeps')
        await this.$scriptx.load('https://unpkg.com/@vueuse/shared')
        await this.$scriptx.load('https://unpkg.com/@vueuse/core')
        // console.timeEnd('AppRoot:loadDeps')
      }
      this.depsLoaded = true
    },
    registerApp(consumerAppDef) {
      const { markRaw } = getGlobal('Vue')
      let rawAppDefinition = markRaw(consumerAppDef)
      this.internals.store.consumerRootDefs = [
        ...this.internals.store.consumerRootDefs.filter((x) => {
          return x.__name !== rawAppDefinition.__name
        }),
        rawAppDefinition,
      ]
    },
    onConsumerRootMounted(consumerRootMountCtx) {
      this.internals.store.consumerRootMounts = [
        ...this.internals.store.consumerRootMounts.filter((x) => {
          return x.$options.__name !== consumerRootMountCtx.$options.__name
        }),
        consumerRootMountCtx,
      ]
    },
    onConsumerRootShutdown(consumerRootMountCtx) {
      this.internals.store.consumerRootMounts = this.internals.store.consumerRootMounts.filter(
        (x) => {
          return x.$options.__name !== consumerRootMountCtx.$options.__name
        }
      )
      this.internals.store.consumerRootDefs = this.internals.store.consumerRootDefs.filter((x) => {
        return x.__name !== consumerRootMountCtx.$options.__name
      })
    },
  },
  scssResources: css`
    @mixin typo-basic {
      & {
        font-family: 'Lucida Console', monospace;
        font-weight: 400;
        font-size: 16px;
        line-height: 1.1;
      }
    }

    @mixin bbv-scrollbar($size: 4px, $width: $size, $height: $size) {
      &::-webkit-scrollbar {
        display: initial;

        @if $width {
          width: $width;
        } @else {
          width: $size;
        }

        @if $height {
          height: $height;
        } @else {
          height: $size;
        }
      }

      &::-webkit-scrollbar-thumb {
        background-color: var(--bbvButtonFgColor);
      }

      &::-webkit-scrollbar-track {
        background-color: var(--bbvButtonBgColor);
      }
    }
  `,
  scss: css`
    body {
      --bbvBorderColor: #0f4878;
      --bbvBoxShadowColor1: #0000007a;
      --bbvBoxShadowColor2: #040f18;
      --bbvAppInnerFgColor: #89d3e4;
      --bbvAppInnerBgColor: #274b64;
      --bbvFontLightColor: #89d3e4;
      --bbvFontLightAltColor: #89d3e4;
      --bbvButtonFgColor: #12b3e3;
      --bbvButtonBgColor: #0b1420;
      --bbvButtonHoverFgColor: #00fff3;
      --bbvButtonHoverBgColor: #162a47;
      --bbvWindowTitlebarFgColor: #89d3e4;
      --bbvWindowTitlebarBgColor: #0f4878;
      --bbvWindowActionsFgColor: #83d5d9;
      --bbvWindowActionsBgColor: #0f4878;
      --bbvHackerDarkFgColor: #c5c255;
      --bbvHackerDarkBgColor: #171c23;
      --bbvAppTrayFgColor: #89d3e4;
      --bbvAppTrayBorderColor: #4bb4c5;
      --bbvAppTrayBgColor: #274b64;
    }

    [bbv-root] {
      position: fixed;
      z-index: 1500;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      pointer-events: none;
    }

    [bbv-container] {
      @include typo-basic;

      * {
        box-sizing: border-box;
      }
    }

    [bbv-foreground] {
      z-index: 1500;

      & > * {
        pointer-events: auto;
      }
    }

    .__CMP_NAME__ {
      &.rootAppIntro-enter-active,
      &.rootAppIntro-leave-active,
      &.consumerAppIntro-enter-active,
      &.consumerAppIntro-leave-active {
        transition: opacity 0.4s ease, transform 0.4s ease, filter 1s ease;
      }

      &.rootAppIntro-enter-from,
      &.rootAppIntro-leave-to,
      &.consumerAppIntro-enter-from,
      &.consumerAppIntro-leave-to {
        opacity: 0;
      }
    }
  `,
}
