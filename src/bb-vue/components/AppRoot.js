import { html, css, getGlobal } from '/bb-vue/lib.js'

import { nearestConsumerRootMount } from '/bb-vue/components/_resources.js'

import ConsumerRoot from '/bb-vue/components/internal/ConsumerRoot.js'
import StylesheetManager from '/bb-vue/components/internal/StylesheetManager.js'

import Window from '/bb-vue/components/Window.js'
import WindowManager from '/bb-vue/components/WindowManager.js'
import AppTray from '/bb-vue/components/AppTray.js'
import Button from '/bb-vue/components/Button.js'
import JsonDisplay from '/bb-vue/components/JsonDisplay.js'
import Tabs from '/bb-vue/components/Tabs.js'

export const ComponentLibrary = [
  ConsumerRoot,
  StylesheetManager,
  Window,
  WindowManager,
  AppTray,
  Button,
  JsonDisplay,
  Tabs,
]

export default {
  __libraryRoot: true,
  name: 'bbv-app-root',
  template: html`
    <main class="__CMP_NAME__" bbv-container>
      <bbv-consumer-root
        v-for="app in consumerRootDefs"
        :key="app.name"
        :id="app.name"
        :consumer-root-def="app"
        @consumer-root-shutdown="onConsumerRootShutdown"
        @consumer-root-mounted="onConsumerRootMounted"
      />
      <bbv-stylesheet-manager :consumer-root-defs="consumerRootDefs" />
      <bbv-window-manager />
      <bbv-app-tray />
    </main>
  `,
  data() {
    const Mitt = getGlobal('Mitt')
    let bus = Mitt.createBus()

    return {
      internals: {
        bus: bus,
        send: bus.emit,
        listen: bus.on,
        store: {
          consumerRootDefs: [],
          consumerRootMounts: [],
          windowMounts: [],
        },
        nearestConsumerRootMount,
      },
    }
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
    registerApp(appDefinition) {
      const Vue = getGlobal('Vue')
      let rawAppDefinition = Vue.markRaw(appDefinition)
      this.internals.store.consumerRootDefs = [
        ...this.internals.store.consumerRootDefs.filter((x) => {
          return x.name !== rawAppDefinition.name
        }),
        rawAppDefinition,
      ]
    },
    onConsumerRootMounted(consumerRootMountCtx) {
      this.internals.store.consumerRootMounts = [
        ...this.internals.store.consumerRootMounts.filter((x) => {
          return x.$options.name !== consumerRootMountCtx.$options.name
        }),
        consumerRootMountCtx,
      ]
    },
    onConsumerRootShutdown(consumerRootMountCtx) {
      this.internals.store.consumerRootMounts = this.internals.store.consumerRootMounts.filter(
        (x) => {
          return x.$options.name !== consumerRootMountCtx.$options.name
        }
      )
      this.internals.store.consumerRootDefs = this.internals.store.consumerRootDefs.filter((x) => {
        return x.name !== consumerRootMountCtx.$options.name
      })
    },
  },
  scssResources: css`
    @mixin typo-basic {
      font-family: 'Lucida Console', monospace;
      font-weight: 400;
      font-size: 16px;
      line-height: 1.1;
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
      --bbvAppTrayBorderColor: #33e01e;
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

      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;

      * {
        box-sizing: border-box;
      }
    }

    [bbv-foreground] {
      z-index: 1500;
      pointer-events: auto;
    }
  `,
}
